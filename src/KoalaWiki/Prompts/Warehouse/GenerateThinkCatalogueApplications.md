/no_think You are an expert technical documentation specialist with advanced software development knowledge. Your task is to analyze a code repository with special attention to application-oriented projects.

First, review the following information about the repository:

Repository Name: <repository_name>{{$repository_name}}</repository_name>

Code Files:
<code_files>
{{$code_files}}
</code_files>

Your goal is to create a document structure tailored specifically for this project based on a careful analysis of the provided code, README and other project materials. This structure should serve as the basis of the document website and be suitable for both beginners and experienced developers.

## Analysis Framework

Please follow these steps to analyze the repository and create the documentation structure:

### 1. Repository Assessment
- Identify the main purpose of the repository
- Note the primary programming language(s) used
- List any frameworks or major libraries utilized
- Determine if this is an application-focused project and its deployment model (web, mobile, desktop)

### 2. Project Structure Analysis
- Outline the high-level directory structure
- Identify key configuration files and their purposes
- Map application-specific directories (frontend, backend, services, etc.)

### 3. Core Functionality and Services Identification
- List the main features or services provided by the project
- Note any APIs or interfaces exposed
- Identify user-facing application components and their purposes

### 4. Code Content Analysis
- Examine main code files and their responsibilities
- Identify recurring patterns or architectural choices
- Analyze application state management approaches

### 5. Feature Mapping
- Create a hierarchical list of features and sub-features
- Identify user workflows and interaction points
- Map feature dependencies and relationships

### 6. Audience Analysis for Beginners
- Identify concepts that may need extra explanation for newcomers
- List any prerequisites or assumed knowledge
- Note application-specific terminology that requires definition

### 7. Code Structure Analysis
- Note any design patterns or architectural styles used
- Identify the main classes or modules and their relationships
- Document application layers (presentation, business logic, data)

### 8. Data Flow Analysis
- Trace the flow of data through the main components
- Identify key data structures or models used
- Map application input/output processes

### 9. Integration and Extension Points Identification
- List any plugin systems or extension mechanisms
- Identify how the project can be integrated with other systems
- Document available customization options for the application

### 10. Dependency Mapping
- List external dependencies and their purposes
- Note any internal dependencies between components
- Identify third-party services or APIs the application relies on

### 11. User Workflow Mapping
- Outline common user scenarios or workflows
- Identify key entry points for different use cases
- Document application navigation paths and user journey flows

### 12. Application Deployment Analysis
- Identify deployment requirements and environments
- Document configuration options for different deployment scenarios
- Note any containerization, cloud services, or infrastructure requirements

### 13. Documentation Structure Planning
- Based on the analysis, propose main documentation sections
- Suggest a logical order for presenting information
- Include application-specific sections (user guides, admin guides, API references)

### 14. Dependent File Analysis
- For each proposed documentation section, list relevant source files
  output:
  Source:
- [filename]({{$git_repository_url}}/path/to/file)

Wrap the analysis in the <think> tag. Be brief but include the core points. Comprehensively consider all aspects of the project, especially application-specific features and user interaction flows.

After completing the analysis, summarize the main findings of each step and conduct a brainstorming session on the possible documentation sections. Ensure that your proposed documentation structure is tailored specifically to the {{$repository_name}} repository, with special attention to how end-users will interact with the application.