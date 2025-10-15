## Brief overview
Project-specific development guidelines for building a modular, scalable cryptocurrency payment gateway library in Node.js. These rules enforce SOLID principles, TDD methodology, and incremental development practices for enterprise-scale crypto operations.

## Development workflow
- Follow strict Documentation → Test → Code → Refactor cycle for every feature
- Work on one file at a time, complete each file fully before moving to next
- Implement features incrementally, never write entire codebase at once
- Wait for confirmation after each step before proceeding
- Always start with interface definitions and type declarations
- Run ESLint after every code change to ensure code quality and consistency

## Architecture principles
- Strictly adhere to all SOLID principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
- Design chain-agnostic architecture using interface-driven development
- Support both lightweight single-wallet usage and enterprise-scale deployments (500K+ wallets)
- Create modular design where chain-specific libraries are pluggable via configuration
- Build backend-only standalone library with no database or cache dependencies

## Coding best practices
- Apply DRY principle consistently - eliminate code duplication
- Use TypeScript exclusively with strict type checking
- Write English-only code, comments, and documentation
- Implement interface segregation - create focused, minimal interfaces
- Design for dependency injection and pluggable components
- Optimize for high performance and memory efficiency at scale

## Testing strategy
- Follow Test-Driven Development (TDD) methodology religiously
- Write comprehensive unit tests for each interface implementation  
- Create integration tests for cross-module functionality
- Use mock chain adapters for testing without blockchain connections
- Include performance tests for monitoring and processing systems
- Add security tests for all cryptographic operations

## Performance requirements
- Design to handle 10 chains × 50,000 wallets × 10 tokens simultaneously
- Implement batch processing, connection pooling, and efficient data structures
- Support both memory-efficient lightweight mode and full-featured enterprise mode
- Use worker threads for CPU-intensive cryptographic operations
- Provide configurable resource limits and performance controls

## Code organization
- Structure project with clear separation between core, wallet, treasury, payment, and chain modules
- Create separate chain adapter libraries that implement common interfaces
- Use factory patterns for wallet and chain adapter creation
- Implement strategy patterns for notifications, encryption, and treasury management
- Maintain clean imports and exports with barrel files
