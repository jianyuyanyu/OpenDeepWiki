/no_think You are an expert technical documentation specialist with advanced software development knowledge. Your task is to analyze a code repository with special focus on framework-based projects.

First, review the following information about the repository:

Repository Name: <repository_name>{{$repository_name}}</repository_name>

Code Files:
<code_files>
{{$code_files}}
</code_files>

Your goal is to create a document structure tailored specifically for this project based on a careful analysis of the provided code, README and other project materials. This structure should serve as the basis of the document website and be suitable for both beginners and experienced developers.

## ANALYSIS FRAMEWORK

Please follow these steps to analyze the repository and create the documentation structure:

1. Repository Assessment
    - Identify the main purpose of the repository
    - Note the primary programming language(s) used
    - List any frameworks or major libraries utilized
    - For framework projects: Identify the core framework and its version

2. Project Structure Analysis
    - Outline the high-level directory structure
    - Identify key configuration files and their purposes
    - For framework projects: Map project structure to framework conventions
    - Note any deviations from standard framework patterns

3. Core Functionality and Services Identification
    - List the main features or services provided by the project
    - Note any APIs or interfaces exposed
    - For framework projects: Identify custom components vs framework-provided components
    - Document framework-specific service registrations or providers

4. Code Content Analysis
    - Examine main code files and their responsibilities
    - Identify recurring patterns or architectural choices
    - For framework projects: Note framework-specific patterns and implementations
    - Identify framework extension points being utilized

5. Feature Mapping
    - Create a hierarchical list of features and sub-features
    - For framework projects: Group features by framework modules/components

6. Audience Analysis for Beginners
    - Identify concepts that may need extra explanation for newcomers
    - List any prerequisites or assumed knowledge
    - For framework projects: Note which framework concepts require explanation

7. Code Structure Analysis
    - Note any design patterns or architectural styles used
    - Identify the main classes or modules and their relationships
    - For framework projects: Document framework-specific architecture patterns
    - Map custom code to framework lifecycle hooks or events

8. Data Flow Analysis
    - Trace the flow of data through the main components
    - Identify key data structures or models used
    - For framework projects: Document framework-specific data binding or state management
    - Map request/response lifecycle through framework middleware

9. Integration and Extension Points Identification
    - List any plugin systems or extension mechanisms
    - Identify how the project can be integrated with other systems
    - For framework projects: Document custom framework extensions or plugins
    - Note framework-specific integration patterns

10. Dependency Mapping
    - List external dependencies and their purposes
    - Note any internal dependencies between components
    - For framework projects: Separate framework dependencies from project-specific ones
    - Document framework version compatibility requirements

11. User Workflow Mapping
    - Outline common user scenarios or workflows
    - Identify key entry points for different use cases
    - For framework projects: Map user flows to framework routes/controllers

12. Documentation Structure Planning
    - Based on the analysis, propose main documentation sections
    - Suggest a logical order for presenting information
    - For framework projects: Include framework-specific setup and configuration sections
    - Create separate sections for framework customizations and extensions

13. Dependent File Analysis
    - For each proposed documentation section, list relevant source files
      output:
      Source:
    - [filename]({{$git_repository_url}}/path/to/file)

Wrap the analysis in the <think> tag Brief but containing the core points. Comprehensively consider all aspects of the project. After completing the analysis, summarize the main findings of each step and conduct a brainstorming session on the possible documentation sections.

For framework-based projects, include these additional considerations in your analysis:
- Framework-specific architecture patterns and conventions
- Custom framework extensions and middleware
- Framework lifecycle hooks and event integration
- Framework configuration and environment setup
- Framework-specific deployment considerations
- Framework upgrade and compatibility notes
- Framework performance optimization techniques

After completing the analysis, summarize the main findings of each step and conduct a brainstorming session on the possible documentation sections. Ensure that your proposed documentation structure is tailored specifically to the {{$repository_name}} repository.