using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using OpenDeepWiki.Agents;
using OpenDeepWiki.Chat;
using OpenDeepWiki.Endpoints;
using OpenDeepWiki.Endpoints.Admin;
using OpenDeepWiki.Infrastructure;
using OpenDeepWiki.Services.Admin;
using OpenDeepWiki.Services.Organizations;
using OpenDeepWiki.Services.Auth;
using OpenDeepWiki.Services.OAuth;
using OpenDeepWiki.Services.Prompts;
using OpenDeepWiki.Services.Repositories;
using OpenDeepWiki.Services.Recommendation;
using OpenDeepWiki.Services.UserProfile;
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
    // ASCII Art Banner
    var banner = """
    
     ██████╗ ██████╗ ███████╗███╗   ██╗██████╗ ███████╗███████╗██████╗ ██╗    ██╗██╗██╗  ██╗██╗
    ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗██╔════╝██╔════╝██╔══██╗██║    ██║██║██║ ██╔╝██║
    ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║  ██║█████╗  █████╗  ██████╔╝██║ █╗ ██║██║█████╔╝ ██║
    ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║  ██║██╔══╝  ██╔══╝  ██╔═══╝ ██║███╗██║██║██╔═██╗ ██║
    ╚██████╔╝██║     ███████╗██║ ╚████║██████╔╝███████╗███████╗██║     ╚███╔███╔╝██║██║  ██╗██║
     ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝╚═╝      ╚══╝╚══╝ ╚═╝╚═╝  ╚═╝╚═╝
                                                                                    
                             ██████╗  ██████╗ ██╗
                            ██╔════╝ ██╔═══██╗██║
                            ██║  ███╗██║   ██║██║
                            ██║   ██║██║   ██║╚═╝
                            ╚██████╔╝╚██████╔╝██╗
                             ╚═════╝  ╚═════╝ ╚═╝
    
    """;
    Console.WriteLine(banner);
    
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
                options.SecretKey = builder.Configuration["JWT_SECRET_KEY"]
                    ?? throw new InvalidOperationException("JWT密钥未配置");
            }
        });

    // 添加JWT认证
    var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
    var secretKey = jwtOptions.SecretKey;
    if (string.IsNullOrWhiteSpace(secretKey))
    {
        secretKey = builder.Configuration["JWT_SECRET_KEY"]
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
                options.ApiKey = builder.Configuration["CHAT_API_KEY"];
            }

            if (string.IsNullOrWhiteSpace(options.Endpoint))
            {
                options.Endpoint = builder.Configuration["ENDPOINT"];
            }

            if (!options.RequestType.HasValue)
            {
                var requestType = builder.Configuration["CHAT_REQUEST_TYPE"];
                if (Enum.TryParse<AiRequestType>(requestType, true, out var parsed))
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
            var repoDir = builder.Configuration["REPOSITORIES_DIRECTORY"];
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
            // Catalog 配置
            var catalogModel = builder.Configuration["WIKI_CATALOG_MODEL"];
            if (!string.IsNullOrWhiteSpace(catalogModel))
            {
                options.CatalogModel = catalogModel;
            }

            var catalogEndpoint = builder.Configuration["WIKI_CATALOG_ENDPOINT"];
            if (!string.IsNullOrWhiteSpace(catalogEndpoint))
            {
                options.CatalogEndpoint = catalogEndpoint;
            }

            var catalogApiKey = builder.Configuration["WIKI_CATALOG_API_KEY"];
            if (!string.IsNullOrWhiteSpace(catalogApiKey))
            {
                options.CatalogApiKey = catalogApiKey;
            }

            var catalogRequestType = builder.Configuration["WIKI_CATALOG_REQUEST_TYPE"];
            if (Enum.TryParse<AiRequestType>(catalogRequestType, true, out var catalogParsed))
            {
                options.CatalogRequestType = catalogParsed;
            }

            // Content 配置
            var contentModel = builder.Configuration["WIKI_CONTENT_MODEL"];
            if (!string.IsNullOrWhiteSpace(contentModel))
            {
                options.ContentModel = contentModel;
            }

            var contentEndpoint = builder.Configuration["WIKI_CONTENT_ENDPOINT"];
            if (!string.IsNullOrWhiteSpace(contentEndpoint))
            {
                options.ContentEndpoint = contentEndpoint;
            }

            var contentApiKey = builder.Configuration["WIKI_CONTENT_API_KEY"];
            if (!string.IsNullOrWhiteSpace(contentApiKey))
            {
                options.ContentApiKey = contentApiKey;
            }

            var contentRequestType = builder.Configuration["WIKI_CONTENT_REQUEST_TYPE"];
            if (Enum.TryParse<AiRequestType>(contentRequestType, true, out var contentParsed))
            {
                options.ContentRequestType = contentParsed;
            }

            // Translation 配置（可选，不配置则使用 Content 配置）
            var translationModel = builder.Configuration["WIKI_TRANSLATION_MODEL"];
            if (!string.IsNullOrWhiteSpace(translationModel))
            {
                options.TranslationModel = translationModel;
            }

            var translationEndpoint = builder.Configuration["WIKI_TRANSLATION_ENDPOINT"];
            if (!string.IsNullOrWhiteSpace(translationEndpoint))
            {
                options.TranslationEndpoint = translationEndpoint;
            }

            var translationApiKey = builder.Configuration["WIKI_TRANSLATION_API_KEY"];
            if (!string.IsNullOrWhiteSpace(translationApiKey))
            {
                options.TranslationApiKey = translationApiKey;
            }

            var translationRequestType = builder.Configuration["WIKI_TRANSLATION_REQUEST_TYPE"];
            if (Enum.TryParse<AiRequestType>(translationRequestType, true, out var translationParsed))
            {
                options.TranslationRequestType = translationParsed;
            }

            // 多语言配置
            var languages = builder.Configuration["WIKI_LANGUAGES"];
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
    builder.Services.AddScoped<IAdminDepartmentService, AdminDepartmentService>();
    builder.Services.AddScoped<IAdminToolsService, AdminToolsService>();
    builder.Services.AddScoped<IAdminSettingsService, AdminSettingsService>();
    builder.Services.AddScoped<IOrganizationService, OrganizationService>();

    // 注册推荐服务
    builder.Services.AddScoped<RecommendationService>();

    // 注册用户资料服务
    builder.Services.AddScoped<IUserProfileService, UserProfileService>();

    builder.Services.AddHostedService<RepositoryProcessingWorker>();

    // 注册 Chat 系统服务
    // Requirements: 2.2, 2.4 - 通过依赖注入自动发现并加载 Provider
    builder.Services.AddChatServices(builder.Configuration);

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
    app.MapOrganizationEndpoints();
    app.MapRecommendationEndpoints();
    app.MapUserProfileEndpoints();

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