# CLAUDE.md

## Coding Conventions

- **Language:** All code and documentation in English
- **Naming:** PascalCase classes, camelCase methods/variables, SCREAMING_SNAKE_CASE env vars
- **Functions:** Single purpose, <20 instructions, verb-based naming, early returns over nesting
- **Boolean vars:** `isX`, `hasX`, `canX` prefixes
- **Data:** Prefer immutability, use `readonly` and `as const` where appropriate
- **Errors:** Use framework-provided exceptions
- **Testing:** Arrange-Act-Assert pattern
