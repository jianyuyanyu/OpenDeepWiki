using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using OpenAI.Responses;
using System;
using System.ClientModel;

#pragma warning disable OPENAI001

namespace OpenDeepWiki.Agents
{
    public enum AiRequestType
    {
        OpenAI,
        AzureOpenAI,
        OpenAIResponses,
        Anthropic
    }

    public class AiRequestOptions
    {
        public string? Endpoint { get; set; }
        public string? ApiKey { get; set; }
        public AiRequestType? RequestType { get; set; }
    }

    /// <summary>
    /// Options for creating an AI agent.
    /// </summary>
    public class AgentCreationOptions
    {
        /// <summary>
        /// The system instructions for the agent.
        /// </summary>
        public string? Instructions { get; set; }

        /// <summary>
        /// The tools available to the agent.
        /// </summary>
        public IEnumerable<AIFunction>? Tools { get; set; }

        /// <summary>
        /// The name of the agent.
        /// </summary>
        public string? Name { get; set; }
    }

    public class AgentFactory
    {
        private const string DefaultEndpoint = "https://api.routin.ai/v1";
        private readonly AiRequestOptions? _options;

        public AgentFactory(IOptions<AiRequestOptions> options)
        {
            _options = options?.Value;
        }

        /// <summary>
        /// 创建Agent
        /// </summary>
        /// <param name="model"></param>
        /// <param name="clientAgentOptions"></param>
        /// <returns></returns>
        public ChatClientAgent CreateAgent(
            string model,
            Action<ChatClientAgentOptions> clientAgentOptions,
            AiRequestOptions? overrideOptions = null)
        {
            var resolvedOptions = ResolveOptions(overrideOptions ?? _options, allowEnvironmentFallback: true);
            return CreateAgentInternal(model, clientAgentOptions, resolvedOptions);
        }

        /// <summary>
        /// 创建Agent with instructions and tools
        /// </summary>
        /// <param name="model">The model name</param>
        /// <param name="instructions">System instructions for the agent</param>
        /// <param name="tools">Tools available to the agent</param>
        /// <param name="overrideOptions">Optional override options</param>
        /// <returns>A configured ChatClientAgent</returns>
        public ChatClientAgent CreateAgentWithTools(
            string model,
            string? instructions,
            IEnumerable<object>? tools,
            AiRequestOptions? overrideOptions = null)
        {
            var resolvedOptions = ResolveOptions(overrideOptions ?? _options, allowEnvironmentFallback: true);
            return CreateAgentWithToolsInternal(model, instructions, tools, resolvedOptions);
        }

        /// <summary>
        /// Creates an IChatClient with function calling support
        /// </summary>
        /// <param name="model">The model name</param>
        /// <param name="tools">Tools available to the chat client</param>
        /// <param name="overrideOptions">Optional override options</param>
        /// <returns>A tuple containing the IChatClient and the list of AITools</returns>
        public (IChatClient Client, IList<AITool> Tools) CreateChatClientWithTools(
            string model,
            IEnumerable<object>? tools,
            AiRequestOptions? overrideOptions = null)
        {
            var resolvedOptions = ResolveOptions(overrideOptions ?? _options, allowEnvironmentFallback: true);
            return CreateChatClientWithToolsInternal(model, tools, resolvedOptions);
        }

        /// <summary>
        /// 创建Agent
        /// </summary>
        /// <param name="model"></param>
        /// <param name="clientAgentOptions"></param>
        /// <returns></returns>
        public static ChatClientAgent CreateAgent(string model, Action<ChatClientAgentOptions> clientAgentOptions)
        {
            var resolvedOptions = ResolveOptions(null, allowEnvironmentFallback: true);
            return CreateAgentInternal(model, clientAgentOptions, resolvedOptions);
        }

        private static ChatClientAgent CreateAgentInternal(
            string model,
            Action<ChatClientAgentOptions> clientAgentOptions,
            AiRequestOptions options)
        {
            var openAiClient = new OpenAIClient(
                new ApiKeyCredential(options.ApiKey ?? string.Empty),
                new OpenAIClientOptions()
                {
                    Endpoint = new Uri(options.Endpoint ?? DefaultEndpoint),
                });

            var agentOptions = new ChatClientAgentOptions();
            clientAgentOptions.Invoke(agentOptions);

            return options.RequestType switch
            {
                AiRequestType.OpenAI => openAiClient.GetChatClient(model).AsAIAgent(agentOptions),
                AiRequestType.OpenAIResponses => openAiClient.GetResponsesClient(model).AsAIAgent(agentOptions),
                AiRequestType.AzureOpenAI => throw new NotSupportedException("AzureOpenAI is not supported yet."),
                AiRequestType.Anthropic => throw new NotSupportedException("Anthropic is not supported yet."),
                _ => throw new NotSupportedException("Unknown AI request type.")
            };
        }

        private static ChatClientAgent CreateAgentWithToolsInternal(
            string model,
            string? instructions,
            IEnumerable<object>? tools,
            AiRequestOptions options)
        {
            var openAiClient = new OpenAIClient(
                new ApiKeyCredential(options.ApiKey ?? string.Empty),
                new OpenAIClientOptions()
                {
                    Endpoint = new Uri(options.Endpoint ?? DefaultEndpoint),
                });

            var chatClient = openAiClient.GetChatClient(model);

            // Convert tools to AITool instances using reflection to find methods with Description attribute
            var aiTools = new List<AITool>();
            if (tools != null)
            {
                foreach (var tool in tools)
                {
                    var toolType = tool.GetType();
                    var methods = toolType.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
                        .Where(m => m.GetCustomAttributes(typeof(System.ComponentModel.DescriptionAttribute), false).Any());

                    foreach (var method in methods)
                    {
                        // Create a delegate for the method
                        var aiFunction = AIFunctionFactory.Create(method, tool);
                        aiTools.Add(aiFunction);
                    }
                }
            }

            return options.RequestType switch
            {
                AiRequestType.OpenAI => new ChatClientAgent(
                    chatClient.AsIChatClient(),
                    instructions: instructions,
                    tools: aiTools),
                AiRequestType.OpenAIResponses => openAiClient.GetResponsesClient(model).AsAIAgent(new ChatClientAgentOptions()),
                AiRequestType.AzureOpenAI => throw new NotSupportedException("AzureOpenAI is not supported yet."),
                AiRequestType.Anthropic => throw new NotSupportedException("Anthropic is not supported yet."),
                _ => throw new NotSupportedException("Unknown AI request type.")
            };
        }

        private static (IChatClient Client, IList<AITool> Tools) CreateChatClientWithToolsInternal(
            string model,
            IEnumerable<object>? tools,
            AiRequestOptions options)
        {
            var openAiClient = new OpenAIClient(
                new ApiKeyCredential(options.ApiKey ?? string.Empty),
                new OpenAIClientOptions()
                {
                    Endpoint = new Uri(options.Endpoint ?? DefaultEndpoint),
                });

            var chatClient = openAiClient.GetChatClient(model).AsIChatClient();

            // Convert tools to AIFunction instances using reflection to find methods with Description attribute
            var aiTools = new List<AITool>();
            if (tools != null)
            {
                foreach (var tool in tools)
                {
                    var toolType = tool.GetType();
                    var methods = toolType.GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
                        .Where(m => m.GetCustomAttributes(typeof(System.ComponentModel.DescriptionAttribute), false).Any());

                    foreach (var method in methods)
                    {
                        var aiFunction = AIFunctionFactory.Create(method, tool);
                        aiTools.Add(aiFunction);
                    }
                }
            }

            // Wrap the chat client with function invocation middleware
            var functionInvokingClient = new FunctionInvokingChatClient(chatClient);
            return (functionInvokingClient, aiTools);
        }

        private static AiRequestOptions ResolveOptions(
            AiRequestOptions? options,
            bool allowEnvironmentFallback)
        {
            var resolved = new AiRequestOptions
            {
                ApiKey = options?.ApiKey,
                Endpoint = options?.Endpoint,
                RequestType = options?.RequestType
            };

            if (allowEnvironmentFallback)
            {
                if (string.IsNullOrWhiteSpace(resolved.ApiKey))
                {
                    resolved.ApiKey = Environment.GetEnvironmentVariable("CHAT_API_KEY");
                }

                if (string.IsNullOrWhiteSpace(resolved.Endpoint))
                {
                    resolved.Endpoint = Environment.GetEnvironmentVariable("ENDPOINT");
                }

                if (!resolved.RequestType.HasValue)
                {
                    resolved.RequestType = TryParseRequestType(Environment.GetEnvironmentVariable("MODEL_PROVIDER"));
                }
            }

            if (string.IsNullOrWhiteSpace(resolved.Endpoint))
            {
                resolved.Endpoint = DefaultEndpoint;
            }

            if (!resolved.RequestType.HasValue)
            {
                resolved.RequestType = AiRequestType.OpenAI;
            }

            return resolved;
        }

        private static AiRequestType? TryParseRequestType(string? requestType)
        {
            if (string.IsNullOrWhiteSpace(requestType))
            {
                return null;
            }

            return Enum.TryParse<AiRequestType>(requestType, true, out var parsed)
                ? parsed
                : null;
        }
    }
}