namespace OpenDeepWiki.Services.Wiki;

/// <summary>
/// Configuration options for the Wiki Generator.
/// Supports separate model configurations for catalog and content generation.
/// </summary>
public class WikiGeneratorOptions
{
    /// <summary>
    /// Configuration section name in appsettings.json.
    /// </summary>
    public const string SectionName = "WikiGenerator";

    /// <summary>
    /// The AI model to use for catalog structure generation.
    /// Default: gpt-4o-mini (faster and cheaper for structural tasks).
    /// </summary>
    public string CatalogModel { get; set; } = "gpt-5-mini";

    /// <summary>
    /// The AI model to use for document content generation.
    /// Default: gpt-4o (better quality for content generation).
    /// </summary>
    public string ContentModel { get; set; } = "gpt-5.2";

    /// <summary>
    /// Optional custom endpoint for catalog generation.
    /// If not set, falls back to the default AI endpoint.
    /// </summary>
    public string? CatalogEndpoint { get; set; }

    /// <summary>
    /// Optional custom endpoint for content generation.
    /// If not set, falls back to the default AI endpoint.
    /// </summary>
    public string? ContentEndpoint { get; set; }

    /// <summary>
    /// Optional API key for catalog generation.
    /// If not set, falls back to the default AI API key.
    /// </summary>
    public string? CatalogApiKey { get; set; }

    /// <summary>
    /// Optional API key for content generation.
    /// If not set, falls back to the default AI API key.
    /// </summary>
    public string? ContentApiKey { get; set; }

    /// <summary>
    /// The directory containing prompt template files.
    /// Default: prompts
    /// </summary>
    public string PromptsDirectory { get; set; } = "prompts";

    /// <summary>
    /// Maximum retry attempts for AI generation operations.
    /// Default: 3
    /// </summary>
    public int MaxRetryAttempts { get; set; } = 3;

    /// <summary>
    /// Delay between retry attempts in milliseconds.
    /// Default: 1000
    /// </summary>
    public int RetryDelayMs { get; set; } = 1000;

    /// <summary>
    /// Gets the AiRequestOptions for catalog generation.
    /// </summary>
    /// <returns>AiRequestOptions configured for catalog generation.</returns>
    public Agents.AiRequestOptions GetCatalogRequestOptions()
    {
        return new Agents.AiRequestOptions
        {
            Endpoint = CatalogEndpoint,
            ApiKey = CatalogApiKey
        };
    }

    /// <summary>
    /// Gets the AiRequestOptions for content generation.
    /// </summary>
    /// <returns>AiRequestOptions configured for content generation.</returns>
    public Agents.AiRequestOptions GetContentRequestOptions()
    {
        return new Agents.AiRequestOptions
        {
            Endpoint = ContentEndpoint,
            ApiKey = ContentApiKey
        };
    }
}
