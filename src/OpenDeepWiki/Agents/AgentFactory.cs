using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using OpenAI.Responses;
using System;
using System.ClientModel;

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
                AiRequestType.OpenAI => openAiClient.GetChatClient(model).CreateAIAgent(agentOptions),
                AiRequestType.OpenAIResponses => openAiClient.GetResponsesClient(model).CreateAIAgent(agentOptions),
                AiRequestType.AzureOpenAI => throw new NotSupportedException("AzureOpenAI is not supported yet."),
                AiRequestType.Anthropic => throw new NotSupportedException("Anthropic is not supported yet."),
                _ => throw new NotSupportedException("Unknown AI request type.")
            };
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
