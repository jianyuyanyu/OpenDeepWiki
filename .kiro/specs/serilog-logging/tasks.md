# Implementation Plan: Serilog Logging Integration

## Overview

This plan implements Serilog as the structured logging provider for OpenDeepWiki, replacing the default Microsoft logging infrastructure. The implementation follows a progressive approach: first adding packages, then configuring the core pipeline, adding sinks, and finally integrating request logging.

## Tasks

- [ ] 1. Add Serilog NuGet packages
  - Add `Serilog.AspNetCore` package to OpenDeepWiki.csproj
  - Add `Serilog.Sinks.File` package for file output
  - Add `Serilog.Expressions` package for filtering
  - _Requirements: 1.1, 1.2_

- [ ] 2. Create logging configuration infrastructure
  - [ ] 2.1 Create LoggingOptions class in Infrastructure folder
    - Define LogDirectory, RetainedFileCountLimit, MinimumLevel properties
    - Add default values as specified in design
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  
  - [ ] 2.2 Create SerilogConfiguration extension class
    - Create `AddSerilogLogging` extension method for WebApplicationBuilder
    - Create `UseSerilogLogging` extension method for WebApplication
    - _Requirements: 1.1, 1.2_

- [ ] 3. Implement Serilog bootstrap and core configuration
  - [ ] 3.1 Update Program.cs with bootstrap logger
    - Add try/catch/finally pattern for startup error capture
    - Create bootstrap logger before WebApplicationBuilder
    - Add `Log.CloseAndFlushAsync()` in finally block
    - _Requirements: 1.4_
  
  - [ ] 3.2 Configure Serilog pipeline in AddSerilogLogging
    - Read configuration from appsettings.json
    - Configure minimum log levels with namespace overrides
    - Add enrichers (FromLogContext, WithMachineName, WithEnvironmentName)
    - _Requirements: 1.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2_
  
  - [ ] 3.3 Write property test for log event structure
    - **Property 1: Log Event Structure Completeness**
    - **Validates: Requirements 2.3, 4.1, 4.2, 4.3, 4.4**

- [ ] 4. Implement Console sink
  - [ ] 4.1 Configure Console sink with environment-aware log levels
    - Debug level for Development environment
    - Information level for Production environment
    - Configure output template with timestamp, level, source context
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 5. Implement File sink for error logging
  - [ ] 5.1 Configure File sink with rolling daily files
    - Restrict to Error level and above
    - Configure JSON formatter for structured output
    - Set rolling interval to daily
    - Configure retention based on LoggingOptions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ] 5.2 Write property test for file sink error filtering
    - **Property 2: File Sink Error Level Filtering**
    - **Validates: Requirements 3.1**
  
  - [ ] 5.3 Write property test for JSON file format
    - **Property 3: JSON File Format Validity**
    - **Validates: Requirements 3.5**

- [ ] 6. Checkpoint - Verify core logging works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement exception logging
  - [ ] 7.1 Configure exception destructuring in Serilog
    - Ensure full exception details including stack trace are captured
    - _Requirements: 4.5_
  
  - [ ] 7.2 Write property test for exception details
    - **Property 4: Exception Details Preservation**
    - **Validates: Requirements 4.5**

- [ ] 8. Implement HTTP request logging
  - [ ] 8.1 Add UseSerilogRequestLogging middleware
    - Configure in UseSerilogLogging extension method
    - Include request path, method, status code, duration
    - Exclude health check endpoints from verbose logging
    - _Requirements: 4.6, 6.1, 6.2, 6.4_
  
  - [ ] 8.2 Configure correlation ID enrichment
    - Add RequestId to all request-scoped log events
    - _Requirements: 6.3_
  
  - [ ] 8.3 Write property test for HTTP request logging
    - **Property 5: HTTP Request Logging Completeness**
    - **Validates: Requirements 4.6, 6.1, 6.2**
  
  - [ ] 8.4 Write property test for correlation ID
    - **Property 6: Correlation ID Enrichment**
    - **Validates: Requirements 6.3**

- [ ] 9. Update configuration files
  - [ ] 9.1 Update appsettings.json with Serilog configuration
    - Add Serilog section with default settings
    - Configure log level overrides for Microsoft namespaces
    - _Requirements: 1.3, 5.1, 5.2_
  
  - [ ] 9.2 Update appsettings.Development.json
    - Configure Debug level for Development
    - _Requirements: 2.1_
  
  - [ ] 9.3 Write property test for default configuration
    - **Property 7: Default Configuration Fallback**
    - **Validates: Requirements 5.5**

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using FsCheck
- Unit tests validate specific examples and edge cases
- Test files should be created in `tests/OpenDeepWiki.Tests/Infrastructure/`
