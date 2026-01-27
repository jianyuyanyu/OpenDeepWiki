using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;

namespace OpenDeepWiki.Infrastructure;

/// <summary>
/// Extension methods for configuring Serilog logging.
/// </summary>
public static class SerilogConfiguration
{
    /// <summary>
    /// Adds Serilog logging to the application builder.
    /// </summary>
    public static WebApplicationBuilder AddSerilogLogging(this WebApplicationBuilder builder)
    {
        var loggingOptions = builder.Configuration
            .GetSection(LoggingOptions.SectionName)
            .Get<LoggingOptions>() ?? new LoggingOptions();

        var logDirectory = loggingOptions.LogDirectory;
        if (!Path.IsPathRooted(logDirectory))
        {
            logDirectory = Path.Combine(AppContext.BaseDirectory, logDirectory);
        }

        // Ensure log directory exists
        if (!Directory.Exists(logDirectory))
        {
            Directory.CreateDirectory(logDirectory);
        }

        var minimumLevel = Enum.TryParse<LogEventLevel>(loggingOptions.MinimumLevel, true, out var level)
            ? level
            : LogEventLevel.Information;

        builder.Host.UseSerilog((context, services, configuration) =>
        {
            configuration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                // Core enrichers
                .Enrich.FromLogContext()
                .Enrich.WithProperty("Application", "OpenDeepWiki")
                .Enrich.WithProperty("Environment", context.HostingEnvironment.EnvironmentName)
                // Additional enrichers for detailed context
                .Enrich.WithMachineName()
                .Enrich.WithProcessId()
                .Enrich.WithProcessName()
                .Enrich.WithThreadId()
                .Enrich.WithThreadName()
                // Minimum levels
                .MinimumLevel.Is(minimumLevel)
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
                .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
                .MinimumLevel.Override("System", LogEventLevel.Warning)
                // Enable detailed logging for our services
                .MinimumLevel.Override("OpenDeepWiki", LogEventLevel.Debug);

            // Console sink - environment-aware log levels with detailed output
            if (context.HostingEnvironment.IsDevelopment())
            {
                configuration.WriteTo.Console(
                    restrictedToMinimumLevel: LogEventLevel.Debug,
                    outputTemplate: "[{Timestamp:HH:mm:ss.fff} {Level:u3}] [{ThreadId}] {SourceContext}{NewLine}    {Message:lj}{NewLine}{Exception}");
            }
            else
            {
                configuration.WriteTo.Console(
                    restrictedToMinimumLevel: LogEventLevel.Information,
                    outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] [{MachineName}/{ProcessId}] {SourceContext}{NewLine}    {Message:lj}{NewLine}{Exception}");
            }

            // File sink - all logs with daily rolling (structured JSON)
            var allLogPath = Path.Combine(logDirectory, "opendeepwiki-.log");
            configuration.WriteTo.File(
                allLogPath,
                restrictedToMinimumLevel: LogEventLevel.Debug,
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: loggingOptions.RetainedFileCountLimit,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] [{ThreadId}] [{SourceContext}] {Message:lj}{NewLine}{Properties:j}{NewLine}{Exception}",
                shared: true,
                fileSizeLimitBytes: 100 * 1024 * 1024, // 100MB per file
                rollOnFileSizeLimit: true);

            // File sink - error logging only with daily rolling (JSON format for analysis)
            var errorLogPath = Path.Combine(logDirectory, "errors-.json");
            configuration.WriteTo.File(
                new CompactJsonFormatter(),
                errorLogPath,
                restrictedToMinimumLevel: LogEventLevel.Error,
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: loggingOptions.RetainedFileCountLimit,
                shared: true);

            // File sink - repository processing specific logs
            var processingLogPath = Path.Combine(logDirectory, "processing-.log");
            configuration.WriteTo.Logger(lc => lc
                .Filter.ByIncludingOnly(e => 
                    e.Properties.ContainsKey("SourceContext") &&
                    e.Properties["SourceContext"].ToString().Contains("Repository") ||
                    e.Properties["SourceContext"].ToString().Contains("Wiki"))
                .WriteTo.File(
                    processingLogPath,
                    restrictedToMinimumLevel: LogEventLevel.Information,
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: loggingOptions.RetainedFileCountLimit,
                    outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {SourceContext}{NewLine}    {Message:lj}{NewLine}{Properties:j}{NewLine}{Exception}",
                    shared: true));

            // File sink - AI agent specific logs
            var agentLogPath = Path.Combine(logDirectory, "agents-.log");
            configuration.WriteTo.Logger(lc => lc
                .Filter.ByIncludingOnly(e => 
                    e.Properties.ContainsKey("SourceContext") &&
                    (e.Properties["SourceContext"].ToString().Contains("Agent") ||
                     e.Properties["SourceContext"].ToString().Contains("Tool")))
                .WriteTo.File(
                    agentLogPath,
                    restrictedToMinimumLevel: LogEventLevel.Debug,
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: loggingOptions.RetainedFileCountLimit,
                    outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] {SourceContext}{NewLine}    {Message:lj}{NewLine}{Properties:j}{NewLine}{Exception}",
                    shared: true));
        });

        return builder;
    }

    /// <summary>
    /// Configures Serilog request logging middleware.
    /// </summary>
    public static WebApplication UseSerilogLogging(this WebApplication app)
    {
        app.UseSerilogRequestLogging(options =>
        {
            options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
            {
                diagnosticContext.Set("RequestId", httpContext.TraceIdentifier);
                diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
                diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.ToString());
                diagnosticContext.Set("RequestHost", httpContext.Request.Host.ToString());
                diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
                diagnosticContext.Set("QueryString", httpContext.Request.QueryString.ToString());
                
                // Add user identity if authenticated
                if (httpContext.User.Identity?.IsAuthenticated == true)
                {
                    diagnosticContext.Set("UserId", httpContext.User.FindFirst("sub")?.Value ?? "unknown");
                    diagnosticContext.Set("UserName", httpContext.User.Identity.Name ?? "unknown");
                }
            };

            // Exclude health check endpoints from verbose logging
            options.GetLevel = (httpContext, elapsed, ex) =>
            {
                if (ex != null)
                    return LogEventLevel.Error;

                if (httpContext.Response.StatusCode >= 500)
                    return LogEventLevel.Error;

                if (httpContext.Response.StatusCode >= 400)
                    return LogEventLevel.Warning;

                if (httpContext.Request.Path.StartsWithSegments("/health"))
                    return LogEventLevel.Verbose;

                // Log slow requests as warnings
                if (elapsed > 5000)
                    return LogEventLevel.Warning;

                return LogEventLevel.Information;
            };

            options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms [RequestId: {RequestId}]";
        });

        return app;
    }
}
