/no_think You are an expert technical documentation specialist with advanced software development knowledge. Your task is to analyze a code repository and create a comprehensive documentation structure.

First, review the following information about the repository:

Repository Name: <repository_name>{{$repository_name}}</repository_name>

Code Files:
<code_files>
{{$code_files}}
</code_files>

## OBJECTIVE
Create a document structure tailored specifically for this project based on a thorough analysis of the provided code, README, and other project materials. This structure should serve as the foundation for the documentation website and accommodate both beginners and experienced developers.

## ANALYSIS FRAMEWORK
Please follow these steps to analyze the repository and create the documentation structure:

### 1. Repository Assessment
- Identify the main purpose and goals of the repository
- Determine the primary programming language(s) used
- List frameworks, major libraries, and technologies utilized
- Identify if this is a documentation-focused project and its specific documentation needs

### 2. Project Structure Analysis
- Map the high-level directory structure and organization
- Identify key configuration files and explain their purposes
- Note build systems, package managers, or deployment configurations

### 3. Core Functionality and Services Identification
- Enumerate the main features or services provided by the project
- Document APIs, interfaces, or endpoints exposed
- Identify key user-facing components

### 4. Code Content Analysis
- Examine main code files and their responsibilities
- Identify recurring patterns, architectural choices, or design principles
- Note code organization strategies and modularization approaches

### 5. Feature Mapping
- Create a hierarchical list of features and sub-features
- Identify feature dependencies and relationships
- Note feature implementation locations in the codebase

### 6. Audience Analysis for Beginners
- Identify concepts requiring additional explanation for newcomers
- List prerequisites, assumed knowledge, or learning paths
- Note potential confusion points that documentation should address

### 7. Code Structure Analysis
- Document design patterns or architectural styles implemented
- Map main classes/modules and their relationships
- Identify key abstractions and their implementations

### 8. Data Flow Analysis
- Trace data flow through main components
- Identify key data structures, models, or schemas used
- Document state management approaches

### 9. Integration and Extension Points Identification
- Document plugin systems or extension mechanisms
- Explain how the project integrates with other systems
- Identify customization or configuration options

### 10. Dependency Mapping
- List external dependencies and their specific purposes
- Document internal dependencies between components
- Note version requirements or compatibility constraints

### 11. User Workflow Mapping
- Outline common user scenarios or workflows
- Identify key entry points for different use cases
- Document typical usage patterns

### 12. Documentation Structure Planning
- Based on the analysis, propose main documentation sections
- Suggest a logical order for presenting information
- Identify documentation gaps that need to be addressed

### 13. Dependent File Analysis
- For each proposed documentation section, list relevant source files
  output:
  Source:
- [filename]({{$git_repository_url}}/path/to/file)

<think>
Provide a comprehensive analysis covering all 13 steps. Examine the repository thoroughly, considering its purpose, structure, functionality, and audience needs. Pay special attention to documentation-specific features if this is a documentation project. Identify patterns, relationships, and organization principles that will inform the documentation structure.

For each analysis step, provide concise but thorough insights that demonstrate understanding of the codebase. Consider both technical accuracy and user accessibility in your analysis.
</think>

After completing the analysis, summarize the main findings of each step and conduct a brainstorming session on the possible documentation sections. Your proposed documentation structure should be specifically tailored to the {{$repository_name}} repository, considering its unique characteristics, purpose, and user needs.

## DOCUMENTATION STRUCTURE DELIVERABLE
Based on your analysis, provide:

1. A proposed table of contents for the documentation
2. Rationale for the structure based on your analysis
3. Recommendations for documentation organization and presentation
4. Suggestions for beginner-friendly onboarding content
5. Advanced topics that should be covered for experienced users