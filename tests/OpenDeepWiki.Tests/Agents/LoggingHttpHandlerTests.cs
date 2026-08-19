using System.Net;
using System.Text;
using System.Text.Json.Nodes;
using OpenDeepWiki.Agents;
using Xunit;

namespace OpenDeepWiki.Tests.Agents;

public class LoggingHttpHandlerTests
{
    [Theory]
    [InlineData(null, true)]
    [InlineData("null", true)]
    [InlineData("NULL", true)]
    [InlineData("", true)]
    [InlineData("   ", true)]
    [InlineData("{}", false)]
    [InlineData("{\"path\":\"x\"}", false)]
    public void NeedsEmptyArguments_DetectsNullAndEmptyValues(string? value, bool expected)
    {
        JsonNode? node = value is null ? null : JsonValue.Create(value);
        Assert.Equal(expected, LoggingHttpHandler.NeedsEmptyArguments(node));
    }

    [Fact]
    public void NeedsEmptyArguments_TreatsJsonNullAsEmpty()
    {
        var node = JsonNode.Parse("null");
        Assert.True(LoggingHttpHandler.NeedsEmptyArguments(node));
    }

    [Fact]
    public async Task SendAsync_RewritesNullToolCallArgumentsToEmptyObject()
    {
        var captured = new CapturingHandler();
        var handler = new LoggingHttpHandler(captured);
        using var client = new HttpClient(handler);

        var body = """
            {
              "messages": [
                {
                  "role": "assistant",
                  "tool_calls": [
                    {
                      "id": "call_1",
                      "function": {
                        "name": "ReadCatalog",
                        "arguments": "null"
                      }
                    }
                  ]
                }
              ]
            }
            """;

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://example.test/v1/chat/completions")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        await client.SendAsync(request);

        Assert.NotNull(captured.LastBody);
        var root = JsonNode.Parse(captured.LastBody)!;
        var arguments = root["messages"]![0]!["tool_calls"]![0]!["function"]!["arguments"]!.GetValue<string>();
        Assert.Equal("{}", arguments);
    }

    [Fact]
    public async Task SendAsync_DoesNotRewriteLiteralArgumentsNullInsideDocumentContent()
    {
        var captured = new CapturingHandler();
        var handler = new LoggingHttpHandler(captured);
        using var client = new HttpClient(handler);

        var body = """
            {
              "messages": [
                {
                  "role": "user",
                  "content": "example payload contains \"arguments\":\"null\" in the document"
                },
                {
                  "role": "assistant",
                  "tool_calls": [
                    {
                      "id": "call_1",
                      "function": {
                        "name": "WriteDoc",
                        "arguments": "{\"content\":\"the text arguments:\\\"null\\\" stays\"}"
                      }
                    }
                  ]
                }
              ]
            }
            """;

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://example.test/v1/chat/completions")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        await client.SendAsync(request);

        Assert.NotNull(captured.LastBody);
        var root = JsonNode.Parse(captured.LastBody)!;
        var userContent = root["messages"]![0]!["content"]!.GetValue<string>();
        var writeArguments = root["messages"]![1]!["tool_calls"]![0]!["function"]!["arguments"]!.GetValue<string>();

        Assert.Contains("\"arguments\":\"null\"", userContent, StringComparison.Ordinal);
        Assert.Contains("the text arguments:", writeArguments, StringComparison.Ordinal);
        Assert.Contains("null", writeArguments, StringComparison.Ordinal);
        Assert.NotEqual("{}", writeArguments);
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public string? LastBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            LastBody = request.Content == null
                ? null
                : await request.Content.ReadAsStringAsync(cancellationToken);

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{}", Encoding.UTF8, "application/json")
            };
        }
    }
}
