using OpenDeepWiki.Agents;
using OpenDeepWiki.Services.Repositories;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddMiniApis();

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

builder.Services.AddSingleton<AgentFactory>();
builder.Services.AddHostedService<RepositoryProcessingWorker>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference("/v1/scalar");
}

app.MapMiniApis();

app.Run();