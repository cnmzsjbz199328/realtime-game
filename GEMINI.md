# Gemini Project Code Specification

This document aims to establish a strict set of coding standards for the Gemini project to ensure code quality, maintainability, and extensibility. All contributors must adhere to these specifications.

## 1. Core Design Philosophy

### 1.1. High Cohesion, Low Coupling

- **High Cohesion**: Each module, class, or function should focus on a single responsibility or function. Related functionalities should be organized together.
- **Low Coupling**: Reduce inter-module dependencies. Communication between modules should occur through well-defined interfaces (APIs), avoiding direct access to internal implementation details.

### 1.2. Prepare for Future Maintenance and Expansion

Our goal is to build a system that can easily adapt to change. Today's code should not only meet current requirements but also pave the way for future feature expansion and maintenance efforts. This means the code should be clear, modular, and easy to understand and modify.

## 2. File and Directory Structure

The project adopts a directory structure organized by function/responsibility to achieve Separation of Concerns.

- **`api/`**: Contains the implementation of all serverless functions.
- **`application/`**: Includes core business logic and application use cases.
- **`components/` / `presentation/`**: Stores UI components, following patterns like atomic design, divided into reusable units.
- **`core/`**: Defines the project's core domain models, types, and shared utility functions.
- **`infrastructure/`**: Provides concrete implementations for external services, such as database access, AI service interfaces, and third-party API clients.
- **`test/`**: (Recommended) Contains all test code, with an internal structure that mirrors the source code directory for easy navigation.

This structure ensures that each part has a clear responsibility and reduces the coupling between different parts.

## 3. Code Writing Standards

### 3.1. File Length Limit

**The number of code lines in a single file should generally not exceed 200 lines.**

- **Purpose**: To enforce the single responsibility and conciseness of files. An overly long file usually indicates that it undertakes too many responsibilities, making it difficult to read, understand, and maintain.
- **Practice**: When a file approaches or exceeds this limit, refactoring should be immediately considered. The code should be split into smaller, more focused modules or files based on functionality and responsibility.

### 3.2. Function/Method Standards

- **Single Responsibility**: Each function or method should do one thing and do it well.
- **Concise**: Function bodies should be as short as possible. A good rule of thumb is that a function should fit on a single screen.
- **Clear Parameters and Return Values**: Function signatures should clearly indicate their dependencies and outputs. Avoid using implicit global state.

### 3.3. Modularity and Dependency Management

- **Dependency Inversion Principle**: High-level modules should not depend on the concrete implementations of low-level modules but on abstractions (e.g., TypeScript `interface` or `type`).
- **Explicit Dependencies**: All dependencies should be explicitly declared through constructor injection, function parameter passing, etc., making the code easier to test and refactor.

## 4. Naming and Comments

- **Naming**: Use clear, descriptive names for variables, functions, classes, and files. Follow the general naming conventions of the project (e.g., `camelCase` for variables and functions, `PascalCase` for classes and types in TypeScript/JavaScript).
- **Comments**: Comments should explain "why" something is done, not "what" is being done. The code itself should clearly convey its functionality. Add necessary comments only where the logic is complex or the intent is not obvious.

By strictly adhering to these standards, we can build a high-quality, easily maintainable, and extensible software system, laying a solid foundation for the long-term success of the project.