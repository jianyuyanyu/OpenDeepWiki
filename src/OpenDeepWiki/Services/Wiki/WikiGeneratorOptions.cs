using OpenDeepWiki.Agents;

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
    /// The AI provider bound to catalog and mind map generation.
    /// </summary>
    public string? CatalogProviderId { get; set; }

    /// <summary>
    /// The AI model to use for document content generation.
    /// Default: gpt-4o (better quality for content generation).
    /// </summary>
    public string ContentModel { get; set; } = "gpt-5.2";

    /// <summary>
    /// The AI provider bound to content generation.
    /// </summary>
    public string? ContentProviderId { get; set; }

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
    /// Maximum number of parallel document generation tasks.
    /// Default: 5. Configure through system settings.
    /// </summary>
    public int ParallelCount { get; set; } = 5;

    /// <summary>
    /// Maximum output tokens for AI generation.
    /// Default: 32000
    /// </summary>
    public int MaxOutputTokens { get; set; } = 32000;

    /// <summary>
    /// Timeout in minutes for document generation tasks.
    /// Default: 30 minutes
    /// </summary>
    public int DocumentGenerationTimeoutMinutes { get; set; } = 60;

    /// <summary>
    /// Timeout in minutes for translation tasks.
    /// Default: 20 minutes
    /// </summary>
    public int TranslationTimeoutMinutes { get; set; } = 45;

    /// <summary>
    /// Timeout in minutes for catalog title translation tasks.
    /// Default: 2 minutes
    /// </summary>
    public int TitleTranslationTimeoutMinutes { get; set; } = 2;

    /// <summary>
    /// Maximum length for README content before truncation.
    /// Default: 4000 characters
    /// </summary>
    public int ReadmeMaxLength { get; set; } = 4000;

    /// <summary>
    /// Maximum depth for directory tree traversal.
    /// Default: 2 levels
    /// </summary>
    public int DirectoryTreeMaxDepth { get; set; } = 2;

    /// <summary>
    /// Comma-separated list of language codes for multi-language wiki generation.
    /// Example: "en,zh,ja,ko". Can be configured via WIKI_LANGUAGES environment variable.
    /// The primary language selected by user will be generated first, then translated to other languages.
    /// </summary>
    public string? Languages { get; set; } = "en,zh,ja,ko";

    /// <summary>
    /// The AI model to use for translation.
    /// Default: uses ContentModel if not specified.
    /// </summary>
    public string? TranslationModel { get; set; }

    /// <summary>
    /// The AI provider bound to translation.
    /// </summary>
    public string? TranslationProviderId { get; set; }

    /// <summary>
    /// Gets the list of target languages for translation (excluding the primary language).
    /// </summary>
    /// <param name="primaryLanguage">The primary language code to exclude.</param>
    /// <returns>List of language codes to translate to.</returns>
    public List<string> GetTranslationLanguages(string primaryLanguage)
    {
        if (string.IsNullOrWhiteSpace(Languages))
        {
            return new List<string>();
        }

        return Languages
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(l => l.ToLowerInvariant())
            .Where(l => !string.Equals(l, primaryLanguage, StringComparison.OrdinalIgnoreCase))
            .Distinct()
            .ToList();
    }

    /// <summary>
    /// Gets the model to use for translation.
    /// Falls back to ContentModel if not specified.
    /// </summary>
    public string GetTranslationModel()
    {
        return string.IsNullOrWhiteSpace(TranslationModel) ? ContentModel : TranslationModel;
    }
}
