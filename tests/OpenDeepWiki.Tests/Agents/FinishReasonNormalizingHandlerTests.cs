using OpenDeepWiki.Agents;
using Xunit;

namespace OpenDeepWiki.Tests.Agents;

/// <summary>
/// Unit tests for <see cref="FinishReasonNormalizingHandler"/>.
/// Exercises the internal static helpers directly so no HTTP stack is required.
/// </summary>
public class FinishReasonNormalizingHandlerTests
{
    // ------------------------------------------------------------------
    // NormalizeFinishReason – value mapping
    // ------------------------------------------------------------------

    [Theory]
    // OpenAI native values pass through unchanged
    [InlineData("stop",           "stop")]
    [InlineData("length",         "length")]
    [InlineData("tool_calls",     "tool_calls")]
    [InlineData("function_call",  "function_call")]
    [InlineData("content_filter", "content_filter")]
    // Gemini UPPERCASE stop-like
    [InlineData("STOP",           "stop")]
    [InlineData("END_TURN",       "stop")]
    // Gemini UPPERCASE length-like
    [InlineData("MAX_TOKENS",     "length")]
    [InlineData("MAX_TOKEN",      "length")]
    [InlineData("LENGTH",         "length")]
    // Gemini tool/function
    [InlineData("TOOL_CALLS",     "tool_calls")]
    [InlineData("FUNCTION_CALL",  "function_call")]
    // Gemini safety / content_filter
    [InlineData("SAFETY",         "content_filter")]
    [InlineData("RECITATION",     "content_filter")]
    [InlineData("BLOCKLIST",      "content_filter")]
    [InlineData("PROHIBITED_CONTENT", "content_filter")]
    [InlineData("SPII",           "content_filter")]
    [InlineData("CONTENT_FILTER", "content_filter")]
    // Unknown values fall back to "stop"
    [InlineData("OTHER",                     "stop")]
    [InlineData("MALFORMED_FUNCTION_CALL",   "stop")]
    [InlineData("completely_unknown_value",  "stop")]
    public void NormalizeFinishReason_Maps_Correctly(string input, string expected)
    {
        var result = FinishReasonNormalizingHandler.NormalizeFinishReason(input);
        Assert.Equal(expected, result);
    }

    // ------------------------------------------------------------------
    // TransformLine – line-level SSE transformation
    // ------------------------------------------------------------------

    [Fact]
    public void TransformLine_Gemini_MAX_TOKENS_Becomes_length()
    {
        const string line = """data: {"id":"chatcmpl-1","choices":[{"finish_reason":"MAX_TOKENS","delta":{}}]}""";
        var result = FinishReasonNormalizingHandler.TransformLine(line);
        Assert.Contains("\"finish_reason\":\"length\"", result);
    }

    [Fact]
    public void TransformLine_Gemini_STOP_Becomes_stop()
    {
        const string line = """data: {"choices":[{"finish_reason":"STOP","delta":{}}]}""";
        var result = FinishReasonNormalizingHandler.TransformLine(line);
        Assert.Contains("\"finish_reason\":\"stop\"", result);
    }

    [Fact]
    public void TransformLine_Gemini_MALFORMED_FUNCTION_CALL_Becomes_stop()
    {
        const string line = """data: {"choices":[{"finish_reason":"MALFORMED_FUNCTION_CALL","delta":{}}]}""";
        var result = FinishReasonNormalizingHandler.TransformLine(line);
        Assert.Contains("\"finish_reason\":\"stop\"", result);
    }

    [Fact]
    public void TransformLine_Null_FinishReason_IsUnchanged()
    {
        // finish_reason: null must NOT be touched (no quotes, regex won't match)
        const string line = """data: {"choices":[{"finish_reason":null,"delta":{}}]}""";
        var result = FinishReasonNormalizingHandler.TransformLine(line);
        Assert.Equal(line, result);
    }

    [Fact]
    public void TransformLine_Lowercase_stop_IsUnchanged()
    {
        // Already a valid OpenAI value - should pass through without modification
        const string line = """data: {"choices":[{"finish_reason":"stop","delta":{}}]}""";
        var result = FinishReasonNormalizingHandler.TransformLine(line);
        Assert.Equal(line, result);
    }

    [Fact]
    public void TransformLine_NonDataLine_IsUnchanged()
    {
        const string line = "event: chat.completion.chunk";
        var result = FinishReasonNormalizingHandler.TransformLine(line);
        Assert.Equal(line, result);
    }

    [Fact]
    public void TransformLine_DoneSentinel_IsUnchanged()
    {
        const string line = "data: [DONE]";
        var result = FinishReasonNormalizingHandler.TransformLine(line);
        Assert.Equal(line, result);
    }

    [Fact]
    public void TransformLine_EmptyLine_IsUnchanged()
    {
        var result = FinishReasonNormalizingHandler.TransformLine(string.Empty);
        Assert.Equal(string.Empty, result);
    }

    [Fact]
    public void TransformLine_DataLine_WithoutFinishReason_IsUnchanged()
    {
        const string line = """data: {"choices":[{"delta":{"content":"hello"}}]}""";
        var result = FinishReasonNormalizingHandler.TransformLine(line);
        Assert.Equal(line, result);
    }

    [Fact]
    public void TransformLine_Gemini_SAFETY_Becomes_content_filter()
    {
        const string line = """data: {"choices":[{"finish_reason":"SAFETY","delta":{}}]}""";
        var result = FinishReasonNormalizingHandler.TransformLine(line);
        Assert.Contains("\"finish_reason\":\"content_filter\"", result);
    }

    [Fact]
    public void TransformLine_SpaceAroundColon_IsHandled()
    {
        // Regex uses \s* so whitespace around colon is tolerated
        const string line = """data: {"choices":[{"finish_reason" : "MAX_TOKENS","delta":{}}]}""";
        var result = FinishReasonNormalizingHandler.TransformLine(line);
        Assert.Contains("\"finish_reason\"", result);
        Assert.Contains("\"length\"", result);
    }
}
