using OpenDeepWiki.Services.Wiki;
using Xunit;

namespace OpenDeepWiki.Tests.Services.Wiki;

public class MermaidMarkdownNormalizerTests
{
    [Fact]
    public void Normalize_QuotesFlowchartSquareLabelsWithSpecialCharacters()
    {
        var input =
            "## Architecture\n\n" +
            "```mermaid\n" +
            "flowchart TD\n" +
            "    Execute[execute()<br/>Main orchestration]\n" +
            "    Source[src/tasklet.ts<br/>Tasklet]\n" +
            "    Execute --> Source\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected =
            "## Architecture\n\n" +
            "```mermaid\n" +
            "flowchart TD\n" +
            "    Execute[\"execute()<br/>Main orchestration\"]\n" +
            "    Source[\"src/tasklet.ts<br/>Tasklet\"]\n" +
            "    Execute --> Source\n" +
            "```\n";

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_LeavesAlreadyQuotedLabelsUnchanged()
    {
        var input =
            "```mermaid\n" +
            "flowchart LR\n" +
            "    A[\"execute()<br/>Run\"] --> B[\"Done\"]\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        Assert.Equal(input, result);
    }

    [Fact]
    public void Normalize_QuotesFlowchartEdgeLabelsWithSpecialCharacters()
    {
        var input =
            "```mermaid\n" +
            "flowchart TD\n" +
            "    C -->|Да (Claude)| D[\"Настроить MCP серверы\"]\n" +
            "    D -->|Нет / retry| E[Continue]\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected =
            "```mermaid\n" +
            "flowchart TD\n" +
            "    C -->|\"Да (Claude)\"| D[\"Настроить MCP серверы\"]\n" +
            "    D -->|\"Нет / retry\"| E[\"Continue\"]\n" +
            "```\n";

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_LeavesAlreadyQuotedEdgeLabelsUnchanged()
    {
        var input =
            "```mermaid\n" +
            "flowchart LR\n" +
            "    A -->|\"Да (Claude)\"| B[\"Done\"]\n" +
            "    B -.->|`retry (safe)`| C[\"Retry\"]\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        Assert.Equal(input, result);
    }

    [Fact]
    public void Normalize_QuotesFlowchartDiamondLabelsWithExpressions()
    {
        var input =
            "```mermaid\n" +
            "flowchart TD\n" +
            "    A[\"Input: tokens[], excludeKeys\"] --> B{filtered = tokens.filter<br/>!excludeKeys.has(t.tokenKey)}\n" +
            "    B --> C{filtered.length > 0?}\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected =
            "```mermaid\n" +
            "flowchart TD\n" +
            "    A[\"Input: tokens[], excludeKeys\"] --> B{\"filtered = tokens.filter<br/>!excludeKeys.has(t.tokenKey)\"}\n" +
            "    B --> C{\"filtered.length > 0?\"}\n" +
            "```\n";

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_LeavesAlreadyQuotedDiamondLabelsUnchanged()
    {
        var input =
            "```mermaid\n" +
            "flowchart TD\n" +
            "    A --> B{\"filtered = tokens.filter<br/>!excludeKeys.has(t.tokenKey)\"}\n" +
            "    B --> C{`ready (safe)?`}\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        Assert.Equal(input, result);
    }

    [Fact]
    public void Normalize_QuotesFlowchartEdgeLabelsAcrossArrowTypes()
    {
        var input =
            "```mermaid\n" +
            "graph TD\n" +
            "    A ---|Plain| B\n" +
            "    B -.->|Retry (soft)| C\n" +
            "    C ==>|Done / final| D\n" +
            "    E --o|Maybe (optional)| F\n" +
            "    G --x|Rejected (hard)| H\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected =
            "```mermaid\n" +
            "graph TD\n" +
            "    A ---|\"Plain\"| B\n" +
            "    B -.->|\"Retry (soft)\"| C\n" +
            "    C ==>|\"Done / final\"| D\n" +
            "    E --o|\"Maybe (optional)\"| F\n" +
            "    G --x|\"Rejected (hard)\"| H\n" +
            "```\n";

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_PreservesFlowchartShapeSyntax()
    {
        var input =
            "```mermaid\n" +
            "flowchart TD\n" +
            "    Db[(Database)]\n" +
            "    Decision{Ready?}\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected =
            "```mermaid\n" +
            "flowchart TD\n" +
            "    Db[(Database)]\n" +
            "    Decision{\"Ready?\"}\n" +
            "```\n";

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_RewritesErDottedIdentifiersInRelationshipsAndAttributes()
    {
        var input =
            "```mermaid\n" +
            "erDiagram\n" +
            "    ci.TaskletContext ||--o{ ci.TaskletConfig : \"has configs\"\n" +
            "    ci.TaskletContext {\n" +
            "        ci.TaskletConfig active_config \"current config\"\n" +
            "    }\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected =
            "```mermaid\n" +
            "erDiagram\n" +
            "    ci_TaskletContext ||--o{ ci_TaskletConfig : \"has configs\"\n" +
            "    ci_TaskletContext {\n" +
            "        ci_TaskletConfig active_config \"current config; original: ci.TaskletConfig\"\n" +
            "    }\n" +
            "```\n";

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_RewritesErRepeatedAttributeTypes()
    {
        var input =
            "```mermaid\n" +
            "erDiagram\n" +
            "    CONFIG {\n" +
            "        repeated AnthropicApiKeyConfig anthropic_api_keys\n" +
            "        repeated string tags \"tag values\"\n" +
            "        repeated ci.TaskletContext contexts\n" +
            "    }\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected =
            "```mermaid\n" +
            "erDiagram\n" +
            "    CONFIG {\n" +
            "        repeated_AnthropicApiKeyConfig anthropic_api_keys\n" +
            "        repeated_string tags \"tag values\"\n" +
            "        repeated_ci_TaskletContext contexts \"original: repeated ci.TaskletContext\"\n" +
            "    }\n" +
            "```\n";

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_AddsFieldNamesForEnumLikeErAttributes()
    {
        var input =
            "```mermaid\n" +
            "erDiagram\n" +
            "    STATUS {\n" +
            "        NONE \"No value\"\n" +
            "        ACTIVE\n" +
            "    }\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected =
            "```mermaid\n" +
            "erDiagram\n" +
            "    STATUS {\n" +
            "        NONE value_NONE \"No value\"\n" +
            "        ACTIVE value_ACTIVE\n" +
            "    }\n" +
            "```\n";

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_ReplacesClassDiagramEndWithClosingBrace()
    {
        var input =
            "```mermaid\n" +
            "classDiagram\n" +
            "    class ArcanumClient {\n" +
            "        +readonly diffs: DiffsAPI\n" +
            "    end\n" +
            "\n" +
            "    class DiffsAPI {\n" +
            "        <<interface>>\n" +
            "        +get(id: number, options?: FieldsOptions): Promise~Diff~\n" +
            "    end\n" +
            "\n" +
            "    ArcanumClient --> DiffsAPI\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected =
            "```mermaid\n" +
            "classDiagram\n" +
            "    class ArcanumClient {\n" +
            "        +readonly diffs: DiffsAPI\n" +
            "    }\n" +
            "\n" +
            "    class DiffsAPI {\n" +
            "        <<interface>>\n" +
            "        +get(id: number, options?: FieldsOptions): Promise~Diff~\n" +
            "    }\n" +
            "\n" +
            "    ArcanumClient --> DiffsAPI\n" +
            "```\n";

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_LeavesValidClassDiagramBracesUnchanged()
    {
        var input =
            "```mermaid\n" +
            "classDiagram\n" +
            "    class DiffsAPI {\n" +
            "        <<interface>>\n" +
            "        +get(id: number): Promise~Diff~\n" +
            "    }\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        Assert.Equal(input, result);
    }

    [Fact]
    public void Normalize_ReplacesClassDiagramEndWithDifferentCaseAndWhitespace()
    {
        var input =
            "```mermaid\r\n" +
            "classDiagram\r\n" +
            "    class Client {\r\n" +
            "        +api: ApiClient\r\n" +
            "    End   \r\n" +
            "\r\n" +
            "    class ApiClient {\r\n" +
            "        +execute() Response\r\n" +
            "    END\r\n" +
            "```\r\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected =
            "```mermaid\r\n" +
            "classDiagram\r\n" +
            "    class Client {\r\n" +
            "        +api: ApiClient\r\n" +
            "    }\r\n" +
            "\r\n" +
            "    class ApiClient {\r\n" +
            "        +execute() Response\r\n" +
            "    }\r\n" +
            "```\r\n";

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_ReplacesClassDiagramEndWhenMixedWithValidBraces()
    {
        var input =
            "```mermaid\n" +
            "classDiagram\n" +
            "    class Existing {\n" +
            "        +id: string\n" +
            "    }\n" +
            "\n" +
            "    class Generated {\n" +
            "        +name: string\n" +
            "    end\n" +
            "\n" +
            "    Existing --> Generated\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected =
            "```mermaid\n" +
            "classDiagram\n" +
            "    class Existing {\n" +
            "        +id: string\n" +
            "    }\n" +
            "\n" +
            "    class Generated {\n" +
            "        +name: string\n" +
            "    }\n" +
            "\n" +
            "    Existing --> Generated\n" +
            "```\n";

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_DoesNotReplaceFlowchartSubgraphEnd()
    {
        var input =
            "```mermaid\n" +
            "flowchart TD\n" +
            "    subgraph Core[\"Core\"]\n" +
            "        A[\"Service\"] --> B[\"Repository\"]\n" +
            "    end\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        Assert.Contains("    end\n", result);
        Assert.DoesNotContain("    }\n", result);
    }

    [Fact]
    public void Normalize_DoesNotTouchNonMermaidCodeBlocks()
    {
        var input =
            "```typescript\n" +
            "const value = items[0];\n" +
            "```\n";

        var result = MermaidMarkdownNormalizer.Normalize(input);

        Assert.Equal(input, result);
    }

    [Fact]
    public void Normalize_RenamesCollidingSubgraphIdForSetupManagerRepro()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph SetupManager",
            "        Start --> SetupManager[setup_manager.go]",
            "        Bootstrap[Start] --> SetupManager[setup_manager.go] --> Result[Done]",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph sg_SetupManager[\"SetupManager\"]",
            "        Start --> SetupManager[\"setup_manager.go\"]",
            "        Bootstrap[\"Start\"] --> SetupManager[\"setup_manager.go\"] --> Result[\"Done\"]",
            "    end");

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_LeavesCanonicalLabeledSubgraphWithoutCollisionUnchanged()
    {
        var input = MermaidBlock(
            "\n",
            "graph TD",
            "    subgraph Core[\"Core\"]",
            "        A[\"Service\"] --> B[\"Repository\"]",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        Assert.Equal(input, result);
    }

    [Fact]
    public void Normalize_DoesNotRewriteTitleOnlySubgraphWithParenthesizedTitle()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Setup Manager(v2)",
            "        A[\"Call Manager(x)\"] --> B[\"Done\"] %% safe comment",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        Assert.Equal(input, result);
    }

    [Fact]
    public void Normalize_DoesNotTreatUnicodeLikeSubgraphsOrNodesAsAsciiIdentifiers()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Менеджер",
            "        Старт --> Менеджер[данные]",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        Assert.Equal(input, result);
    }

    [Theory]
    [InlineData("class")]
    [InlineData("style")]
    [InlineData("click")]
    [InlineData("linkStyle")]
    public void Normalize_DetectsKeywordLikeNodeIdsWhenTheyAreRealNodeDeclarations(string nodeId)
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            $"    subgraph {nodeId}",
            $"        {nodeId}[real node] --> End",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected = MermaidBlock(
            "\n",
            "flowchart TD",
            $"    subgraph sg_{nodeId}[\"{nodeId}\"]",
            $"        {nodeId}[\"real node\"] --> End",
            "    end");

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_DoesNotTreatSubgraphWithTrailingTextAfterClosedLabelAsExplicitId()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Core[\"API ] Layer\"] trailing",
            "        Start --> Core[worker]",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Core[\"API ] Layer\"] trailing",
            "        Start --> Core[\"worker\"]",
            "    end");

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_DoesNotTreatSubgraphWithUnclosedLabelAsExplicitId()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Core[\"API\"",
            "        Start --> Core[worker]",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Core[\"API\"",
            "        Start --> Core[\"worker\"]",
            "    end");

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_DetectsCollidingNodeDeclarationsWithHorizontalWhitespaceBeforeOpeners()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Square",
            "        Start --> Square [plain] --> Tail[done]",
            "    end",
            "    subgraph Round",
            "        Root --> Round\t([round])",
            "    end",
            "    subgraph Diamond",
            "        Root --> Diamond \t{decision}",
            "    end",
            "    subgraph Flag",
            "        Root --> Flag \t>flag]",
            "    end",
            "    subgraph Json",
            "        Root --> Json \t@{ shape: rect, label: \"json\" }",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph sg_Square[\"Square\"]",
            "        Start --> Square [\"plain\"] --> Tail[\"done\"]",
            "    end",
            "    subgraph sg_Round[\"Round\"]",
            "        Root --> Round\t([round])",
            "    end",
            "    subgraph sg_Diamond[\"Diamond\"]",
            "        Root --> Diamond \t{\"decision\"}",
            "    end",
            "    subgraph sg_Flag[\"Flag\"]",
            "        Root --> Flag \t>flag]",
            "    end",
            "    subgraph sg_Json[\"Json\"]",
            "        Root --> Json \t@{ shape: rect, label: \"json\" }",
            "    end");

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_DetectsCollidingNodeDeclarationsAcrossRepresentativeShapeFamilies()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Square",
            "        Root --> Square[plain]",
            "    end",
            "    subgraph Stadium",
            "        Root --> Stadium([stadium])",
            "    end",
            "    subgraph DoubleCircle",
            "        Root --> DoubleCircle((double))",
            "    end",
            "    subgraph TripleCircle",
            "        Root --> TripleCircle(((triple)))",
            "    end",
            "    subgraph Diamond",
            "        Root --> Diamond{decision}",
            "    end",
            "    subgraph Hexagon",
            "        Root --> Hexagon{{hex}}",
            "    end",
            "    subgraph Subroutine",
            "        Root --> Subroutine[[subroutine]]",
            "    end",
            "    subgraph Cylinder",
            "        Root --> Cylinder[(storage)]",
            "    end",
            "    subgraph SlashForward",
            "        Root --> SlashForward[/input/]",
            "    end",
            "    subgraph SlashBackward",
            "        Root --> SlashBackward[\\output\\]",
            "    end",
            "    subgraph Trapezoid",
            "        Root --> Trapezoid[/input\\]",
            "    end",
            "    subgraph TrapezoidAlt",
            "        Root --> TrapezoidAlt[\\output/]",
            "    end",
            "    subgraph Flag",
            "        Root --> Flag>flag]",
            "    end",
            "    subgraph Json",
            "        Root --> Json@{ shape: rect, label: \"json\" }",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph sg_Square[\"Square\"]",
            "        Root --> Square[\"plain\"]",
            "    end",
            "    subgraph sg_Stadium[\"Stadium\"]",
            "        Root --> Stadium([stadium])",
            "    end",
            "    subgraph sg_DoubleCircle[\"DoubleCircle\"]",
            "        Root --> DoubleCircle((double))",
            "    end",
            "    subgraph sg_TripleCircle[\"TripleCircle\"]",
            "        Root --> TripleCircle(((triple)))",
            "    end",
            "    subgraph sg_Diamond[\"Diamond\"]",
            "        Root --> Diamond{\"decision\"}",
            "    end",
            "    subgraph sg_Hexagon[\"Hexagon\"]",
            "        Root --> Hexagon{{hex}}",
            "    end",
            "    subgraph sg_Subroutine[\"Subroutine\"]",
            "        Root --> Subroutine[[subroutine]]",
            "    end",
            "    subgraph sg_Cylinder[\"Cylinder\"]",
            "        Root --> Cylinder[(storage)]",
            "    end",
            "    subgraph sg_SlashForward[\"SlashForward\"]",
            "        Root --> SlashForward[\"/input/\"]",
            "    end",
            "    subgraph sg_SlashBackward[\"SlashBackward\"]",
            "        Root --> SlashBackward[\"\\\\output\\\\\"]",
            "    end",
            "    subgraph sg_Trapezoid[\"Trapezoid\"]",
            "        Root --> Trapezoid[\"/input\\\\\"]",
            "    end",
            "    subgraph sg_TrapezoidAlt[\"TrapezoidAlt\"]",
            "        Root --> TrapezoidAlt[\"\\\\output/\"]",
            "    end",
            "    subgraph sg_Flag[\"Flag\"]",
            "        Root --> Flag>flag]",
            "    end",
            "    subgraph sg_Json[\"Json\"]",
            "        Root --> Json@{ shape: rect, label: \"json\" }",
            "    end");

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_DoesNotTreatLabelsOrCommentsAsNodeDeclarations()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Manager",
            "        A[Call Manager(x)] --> B[\"Done\"] %% Manager(x) ignored",
            "        C[\"Quoted Manager(x)\"]",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Manager",
            "        A[\"Call Manager(x)\"] --> B[\"Done\"] %% Manager(x) ignored",
            "        C[\"Quoted Manager(x)\"]",
            "    end");

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_StopsScanningLineWhenNodeLabelIsUnclosed()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Manager",
            "        A[Call Manager(x)",
            "        B[\"Done\"]",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        Assert.Equal(input, result);
    }

    [Fact]
    public void Normalize_PreservesExplicitSubgraphLabelWhenRenamingCollision()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph SetupManager [\"Setup Manager\"]",
            "        Start --> SetupManager[setup_manager.go]",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph sg_SetupManager [\"Setup Manager\"]",
            "        Start --> SetupManager[\"setup_manager.go\"]",
            "    end");

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_UsesNextAvailableSuffixWhenSgPrefixIsOccupied()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    sg_SetupManager[Reserved]",
            "    subgraph SetupManager",
            "        Start --> SetupManager[setup_manager.go]",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected = MermaidBlock(
            "\n",
            "flowchart TD",
            "    sg_SetupManager[\"Reserved\"]",
            "    subgraph sg_SetupManager_2[\"SetupManager\"]",
            "        Start --> SetupManager[\"setup_manager.go\"]",
            "    end");

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_RenamesNestedRepeatedExplicitSubgraphIdsDeterministically()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Service",
            "        subgraph Service",
            "            Inner[\"Inner\"]",
            "        end",
            "    end");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph Service",
            "        subgraph sg_Service[\"Service\"]",
            "            Inner[\"Inner\"]",
            "        end",
            "    end");

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_LeavesStyleClassClickAndLinkStyleDirectivesUnchanged()
    {
        var input = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph SetupManager",
            "        Start --> SetupManager[setup_manager.go]",
            "    end",
            "    style SetupManager fill:#f9f,stroke:#333",
            "    class SetupManager hot",
            "    click SetupManager href \"https://example.test/setup\"",
            "    linkStyle default stroke:#333");

        var result = MermaidMarkdownNormalizer.Normalize(input);

        var expected = MermaidBlock(
            "\n",
            "flowchart TD",
            "    subgraph sg_SetupManager[\"SetupManager\"]",
            "        Start --> SetupManager[\"setup_manager.go\"]",
            "    end",
            "    style SetupManager fill:#f9f,stroke:#333",
            "    class SetupManager hot",
            "    click SetupManager href \"https://example.test/setup\"",
            "    linkStyle default stroke:#333");

        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_PreservesCrLfAndIsIdempotentForSubgraphRename()
    {
        var input = MermaidBlock(
            "\r\n",
            "flowchart TD",
            "    subgraph SetupManager",
            "        Start --> SetupManager[setup_manager.go]",
            "    end");

        var normalizedOnce = MermaidMarkdownNormalizer.Normalize(input);
        var normalizedTwice = MermaidMarkdownNormalizer.Normalize(normalizedOnce);

        var expected = MermaidBlock(
            "\r\n",
            "flowchart TD",
            "    subgraph sg_SetupManager[\"SetupManager\"]",
            "        Start --> SetupManager[\"setup_manager.go\"]",
            "    end");

        Assert.Equal(expected, normalizedOnce);
        Assert.Equal(expected, normalizedTwice);
    }

    private static string MermaidBlock(string lineEnding, params string[] lines)
    {
        return "```mermaid" + lineEnding +
               string.Join(lineEnding, lines) + lineEnding +
               "```" + lineEnding;
    }
}
