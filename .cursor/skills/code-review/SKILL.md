---
name: code-review
description: Perform a thorough code review of changes across the app. Checks for strong typing, null safety, code duplication, cyclomatic complexity, N+1 queries, O(n²) algorithms, meaningful test coverage, and general best practices. Use when the user asks for a code review, PR review, or to review changes/diffs.
---

# Code Review

Systematic review of code changes in the app. Inspect every changed file and evaluate against the checklist below.

**Always apply the `deslop` skill** to detect and flag AI-generated code slop (unnecessary comments, defensive try/catch on trusted paths, `any` casts to bypass types, patterns inconsistent with surrounding code).

## Review Process

### Step 1: Gather Changes

Collect the full diff — either from a PR, branch comparison, or staged changes.

### Step 2: Run the Checklist

Evaluate every changed file against ALL categories below. Skip categories only when truly irrelevant to the file type.

### Step 3: Report

Present findings grouped by severity, with file locations and concrete suggestions.

---

## Review Checklist

### 1. Strong Typing

| Check | Details |
|-------|---------|
| No `any` | Flag every `any` — use proper types, generics, or `unknown` with narrowing |
| No type assertions without justification | `as X` should be rare and commented |
| Function signatures | All parameters and return types must be explicitly typed |
| API boundaries | Request/response types must be defined (`*Req`, `*Res` in frontend; DTOs in backend) |
| Generics | Prefer generic constraints over `any` in reusable code |

**Backend-specific:** `noImplicitAny` is off in tsconfig — be extra vigilant for untyped parameters.
**Frontend-specific:** `@typescript-eslint/no-explicit-any` is off in ESLint — reviewers must catch what the linter won't.

### 2. Null Safety

| Check | Details |
|-------|---------|
| Nullable access | No unguarded `.property` on possibly null/undefined values |
| Optional chaining | Use `?.` and `??` instead of `&&` chains or `|| defaultValue` |
| Early returns | Guard clauses for null/undefined at function entry |
| Array operations | Check `.length` or use `??` before accessing `[0]` |
| React props | Optional props must have defaults or null guards in rendering |

### 3. No Code Duplication

| Check | Details |
|-------|---------|
| Copy-paste code | Flag blocks of 3+ lines that are identical or near-identical to existing code |
| Similar logic | If two functions do ~same thing with minor variation, suggest extraction |
| Constants | Repeated magic numbers/strings should be extracted to named constants |
| Backend | Shared logic → service or utility; repeated queries → repository method |
| Frontend | Shared UI → component; shared logic → hook; shared data transforms → utility |

### 4. Cyclomatic / Cognitive Complexity

| Check | Details |
|-------|---------|
| Function length | Flag functions exceeding ~20 statements |
| Nesting depth | Flag nesting deeper than 3 levels |
| Cognitive complexity | Backend threshold is 15 (sonarjs) — apply same standard to frontend |
| Conditionals | Prefer early returns, guard clauses, lookup tables over deep if/else |
| Ternaries | No nested ternaries — extract to variables or functions |

### 5. N+1 Queries & Data Fetching

**Frontend (React Query):**

| Check | Details |
|-------|---------|
| Waterfall fetches | Flag chained `useQuery` where query B `enabled` depends on query A's data — suggest combining at the API level or using a single query |
| Per-item fetches | Flag `useQuery` inside `.map()` or triggered per list item — suggest batch API |
| Redundant refetches | Flag missing or incorrect `queryKey` causing unnecessary refetches |

### 6. Algorithm Complexity (O(n²) and Worse)

| Check | Details |
|-------|---------|
| Nested iterations | `.find()` / `.filter()` / `.includes()` inside `.map()` / `.forEach()` → suggest `Map` or `Set` for O(1) lookups |
| Repeated array scans | Multiple passes over the same array that could be combined into one |
| String concatenation in loops | Use `Array.join()` instead |
| Object creation in loops | Move outside if the result doesn't depend on the loop variable |
| Sort stability | Flag `O(n²)` sorting patterns; prefer built-in `.sort()` |

### 7. Test Quality & Coverage

**Tests must verify behavior, not just exist.** Flag these anti-patterns:

| Anti-pattern | Problem |
|--------------|---------|
| `expect(component).toBeTruthy()` only | Tests rendering, not behavior |
| No assertions | `it('works', () => { render(<X />) })` with no `expect` |
| Testing implementation | Asserting internal state instead of observable behavior |
| Asserting type structure | `expect(obj.id).toBe(1)` on a hand-built object proves nothing |
| Missing edge cases | Only happy path tested — no null, empty, error, boundary cases |
| Snapshot-only | Snapshots without behavioral assertions are fragile and low-value |

**Good tests should:**
- Test user-visible behavior (RTL: queries by role/text, simulates user events)
- Test error/edge cases (null input, empty arrays, API failures)
- Use meaningful assertions (`toHaveBeenCalledWith`, `toHaveTextContent`, state changes)
- Mock external dependencies, not the unit under test

**Frontend:** No enforced thresholds — reviewer must verify new code has adequate tests.

### 8. Codebase Style & Project Conventions

New code must match existing project patterns. Flag deviations from these established conventions.

**Frontend (entromy-ui):**

| Check | Details                                                                                                    |
|-------|------------------------------------------------------------------------------------------------------------|
| State management | React Context only — no Redux, no Zustand, no external state libs                                          |
| Path aliases | Example `@/components/*`, `@/utils/*`, etc. — never deep relative paths like `../../../`                   |
| Naming | `*Res` for API response types, `*UI` for UI-specific types, `*Req` for request payloads                    |
| Imports | React/packages → `@/` aliases → relative → styles                                                          |
| Logging | Only `console.error` allowed (`no-console` is warn)                                                        |

### 9. General Best Practices

| Check | Details |
|-------|---------|
| Single responsibility | Each function/class/component does one thing |
| Function size | <20 statements, verb-based naming, early returns over nesting |
| Naming | `is`/`has`/`can` prefixes for booleans |
| Immutability | Prefer `const`, `readonly`, `as const`; no mutation of function params |
| Dead code | Flag commented-out code, unused imports, unreachable branches |
| Hardcoded values | Extract to config, constants, or environment variables |
| Floating promises | Always `await` async operations or handle with `.catch()` |
| Security | No secrets in code, no raw SQL from user input, proper auth checks |

---

## Report Format

Group findings by severity and present as:

```
## Review Summary

**Files reviewed:** [count]
**Issues found:** 🔴 [n] critical, 🟡 [n] suggestions, 🟢 [n] nits

### 🔴 Critical (must fix)

**[Category] — `path/to/file.ts:L42`**
[Description of the issue]
[Suggested fix with code snippet if helpful]

### 🟡 Suggestions (should fix)

...

### 🟢 Nits (optional)

...

### ✅ What looks good

[Brief positive notes on well-written parts of the change]
```

Severity guide:
- **🔴 Critical:** Bugs, security issues, N+1 queries, `any` at API boundaries, missing null checks that will crash, untested logic
- **🟡 Suggestion:** Code duplication, high complexity, weak tests, O(n²) that could be optimized, missing types on internals
- **🟢 Nit:** Naming improvements, minor style issues, optional refactors
