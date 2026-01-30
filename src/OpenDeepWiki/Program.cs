using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using OpenDeepWiki.Agents;
using OpenDeepWiki.Endpoints;
using OpenDeepWiki.Endpoints.Admin;
using OpenDeepWiki.Infrastructure;
using OpenDeepWiki.Services.Admin;
using OpenDeepWiki.Services.Auth;
using OpenDeepWiki.Services.OAuth;
using OpenDeepWiki.Services.Prompts;
using OpenDeepWiki.Services.Repositories;
using OpenDeepWiki.Services.Wiki;
using Scalar.AspNetCore;
using Serilog;

// Bootstrap logger for startup error capture
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting OpenDeepWiki application");

    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog logging
    builder.AddSerilogLogging();

    // Add services to the container.
    // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
    builder.Services.AddOpenApi();
    builder.Services.AddMiniApis();

    // 根据配置添加数据库服务
    builder.Services.AddDatabase(builder.Configuration);

    // 配置JWT
    builder.Services.AddOptions<JwtOptions>()
        .Bind(builder.Configuration.GetSection("Jwt"))
        .PostConfigure(options =>
        {
            if (string.IsNullOrWhiteSpace(options.SecretKey))
            {
                options.SecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
                    ?? throw new InvalidOperationException("JWT密钥未配置");
            }
        });

    // 添加JWT认证
    var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
    var secretKey = jwtOptions.SecretKey;
    if (string.IsNullOrWhiteSpace(secretKey))
    {
        secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
            ?? "OpenDeepWiki-Default-Secret-Key-Please-Change-In-Production-Environment-2024";
    }

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    });

    // 注册认证服务
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<IJwtService, JwtService>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IOAuthService, OAuthService>();
    builder.Services.AddScoped<IUserContext, UserContext>();

    // 添加HttpClient
    builder.Services.AddHttpClient();

    // 注册Git平台服务
    builder.Services.AddScoped<IGitPlatformService, GitPlatformService>();

    builder.Services.AddOptions<AiRequestOptions>()
        .Bind(builder.Configuration.GetSection("AI"))
        .PostConfigure(options =>
        {
            if (string.IsNullOrWhiteSpace(options.ApiKey))
            {
                options.ApiKey = Environment.GetEnvironmentVariable("CHAT_API_KEY");
            }

            if (string.IsNullOrWhiteSpace(options.Endpoint))
            {
                options.Endpoint = Environment.GetEnvironmentVariable("ENDPOINT");
            }

            if (!options.RequestType.HasValue)
            {
                var modelProvider = Environment.GetEnvironmentVariable("MODEL_PROVIDER");
                if (Enum.TryParse<AiRequestType>(modelProvider, true, out var parsed))
                {
                    options.RequestType = parsed;
                }
            }
        });

    builder.Services
        .AddCors(options =>
        {
            options.AddPolicy("AllowAll",
                policyBuilder => policyBuilder
                    .SetIsOriginAllowed(_ => true)
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials());
        });
    builder.Services.AddSingleton<AgentFactory>();

    // 配置 Repository Analyzer
    builder.Services.AddOptions<RepositoryAnalyzerOptions>()
        .Bind(builder.Configuration.GetSection("RepositoryAnalyzer"))
        .PostConfigure(options =>
        {
            var repoDir = Environment.GetEnvironmentVariable("REPOSITORIES_DIRECTORY");
            if (!string.IsNullOrWhiteSpace(repoDir))
            {
                options.RepositoriesDirectory = repoDir;
            }
        });
    builder.Services.AddScoped<IRepositoryAnalyzer, RepositoryAnalyzer>();

    // 配置 Wiki Generator
    builder.Services.AddOptions<WikiGeneratorOptions>()
        .Bind(builder.Configuration.GetSection(WikiGeneratorOptions.SectionName))
        .PostConfigure(options =>
        {
            // Allow environment variable overrides
            var catalogModel = Environment.GetEnvironmentVariable("WIKI_CATALOG_MODEL");
            if (!string.IsNullOrWhiteSpace(catalogModel))
            {
                options.CatalogModel = catalogModel;
            }

            var contentModel = Environment.GetEnvironmentVariable("WIKI_CONTENT_MODEL");
            if (!string.IsNullOrWhiteSpace(contentModel))
            {
                options.ContentModel = contentModel;
            }

            var catalogEndpoint = Environment.GetEnvironmentVariable("WIKI_CATALOG_ENDPOINT");
            if (!string.IsNullOrWhiteSpace(catalogEndpoint))
            {
                options.CatalogEndpoint = catalogEndpoint;
            }

            var contentEndpoint = Environment.GetEnvironmentVariable("WIKI_CONTENT_ENDPOINT");
            if (!string.IsNullOrWhiteSpace(contentEndpoint))
            {
                options.ContentEndpoint = contentEndpoint;
            }

            var catalogApiKey = Environment.GetEnvironmentVariable("WIKI_CATALOG_API_KEY");
            if (!string.IsNullOrWhiteSpace(catalogApiKey))
            {
                options.CatalogApiKey = catalogApiKey;
            }

            var contentApiKey = Environment.GetEnvironmentVariable("WIKI_CONTENT_API_KEY");
            if (!string.IsNullOrWhiteSpace(contentApiKey))
            {
                options.ContentApiKey = contentApiKey;
            }

            // 多语言配置，逗号分割的语言代码列表，如 "en,zh,ja,ko"
            var languages = Environment.GetEnvironmentVariable("WIKI_LANGUAGES");
            if (!string.IsNullOrWhiteSpace(languages))
            {
                options.Languages = languages;
            }
        });

    // 注册 Prompt Plugin
    builder.Services.AddSingleton<IPromptPlugin>(sp =>
    {
        var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<WikiGeneratorOptions>>().Value;
        var promptsDir = Path.Combine(AppContext.BaseDirectory, options.PromptsDirectory);

        // Fallback to current directory if base directory doesn't have prompts
        if (!Directory.Exists(promptsDir))
        {
            promptsDir = Path.Combine(Directory.GetCurrentDirectory(), options.PromptsDirectory);
        }

        return new FilePromptPlugin(promptsDir);
    });

    // 注册 Wiki Generator
    builder.Services.AddScoped<IWikiGenerator, WikiGenerator>();

    // 注册处理日志服务（使用 Singleton，因为它内部使用 IServiceScopeFactory 创建独立 scope）
    builder.Services.AddSingleton<IProcessingLogService, ProcessingLogService>();

    // 注册管理端服务
    builder.Services.AddScoped<IAdminStatisticsService, AdminStatisticsService>();
    builder.Services.AddScoped<IAdminRepositoryService, AdminRepositoryService>();
    builder.Services.AddScoped<IAdminUserService, AdminUserService>();
    builder.Services.AddScoped<IAdminRoleService, AdminRoleService>();
    builder.Services.AddScoped<IAdminToolsService, AdminToolsService>();
    builder.Services.AddScoped<IAdminSettingsService, AdminSettingsService>();

    builder.Services.AddHostedService<RepositoryProcessingWorker>();

    var app = builder.Build();

    // 初始化数据库
    await DbInitializer.InitializeAsync(app.Services);

    // 启用 CORS
    app.UseCors("AllowAll");

    // Add Serilog request logging
    app.UseSerilogLogging();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.MapScalarApiReference("/v1/scalar");
    }

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapMiniApis();
    app.MapAuthEndpoints();
    app.MapOAuthEndpoints();
    app.MapBookmarkEndpoints();
    app.MapSubscriptionEndpoints();
    app.MapProcessingLogEndpoints();
    app.MapAdminEndpoints();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    await Log.CloseAndFlushAsync();
}