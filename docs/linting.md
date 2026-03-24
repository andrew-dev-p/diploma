# Linting & Static Analysis

This document describes the linting setup, rules, and integration for the CineList project.

## Chosen Linter

**ESLint 9** with flat config (`eslint.config.mjs`).

### Why ESLint?

- **Industry standard** for JavaScript/TypeScript projects
- **Framework support** — `eslint-config-next` provides Next.js-specific rules (Core Web Vitals, React hooks, import resolution)
- **TypeScript integration** — `@typescript-eslint` provides type-aware rules
- **Extensible** — flat config system allows composable rule sets
- **Auto-fixable** — many rules can be automatically fixed with `--fix`

### Additional tools

| Tool | Purpose |
|------|---------|
| **TypeScript** (`tsc --noEmit`) | Static type checking |
| **Prettier** | Code formatting (separate from linting) |

## Rules Configuration

The ESLint config (`eslint.config.mjs`) includes three layers:

### 1. Next.js preset rules

- `eslint-config-next/core-web-vitals` — performance and accessibility rules
- `eslint-config-next/typescript` — TypeScript-specific rules for Next.js

### 2. Custom code quality rules

| Rule | Severity | Purpose |
|------|----------|---------|
| `no-console` | warn | Prevent accidental `console.log` (allows `console.warn` and `console.error`) |
| `no-debugger` | error | Prevent `debugger` statements in production code |
| `no-duplicate-imports` | error | Prevent importing from the same module twice |
| `prefer-const` | error | Use `const` when variable is never reassigned |
| `no-var` | error | Use `let`/`const` instead of `var` |
| `eqeqeq` | error | Require strict equality (`===`) instead of loose (`==`) |
| `curly` | error | Require curly braces for multi-line blocks |

### 3. TypeScript rules

| Rule | Severity | Purpose |
|------|----------|---------|
| `@typescript-eslint/no-unused-vars` | warn | Detect unused variables (ignores `_` prefixed names) |
| `@typescript-eslint/no-explicit-any` | warn | Discourage use of `any` type |
| `@typescript-eslint/consistent-type-imports` | warn | Enforce `import type` for type-only imports |

### 4. React rules

| Rule | Severity | Purpose |
|------|----------|---------|
| `react/self-closing-comp` | warn | Use `<Component />` instead of `<Component></Component>` |
| `react/jsx-boolean-value` | warn | Use `<Comp disabled />` instead of `<Comp disabled={true} />` |
| `react/jsx-curly-brace-presence` | warn | Remove unnecessary curly braces in JSX |
| `react-hooks/purity` | error | Prevent impure function calls during render (e.g., `Date.now()`) |

### 5. Ignored paths

```
.next/**            — build output
out/**              — static export
build/**            — production build
prisma/generated/** — auto-generated Prisma client
node_modules/**     — dependencies
backups/**          — database backups
scripts/**          — shell scripts (not TypeScript)
```

## Running the Linter

```bash
# Run ESLint on entire project
npm run lint

# Run with auto-fix for fixable issues
npx eslint . --fix

# Run TypeScript type check
npm run typecheck

# Run Prettier formatting check
npx prettier --check "**/*.{ts,tsx}"

# Run full quality check (lint + typecheck + format)
npm run quality
```

## Linting Report

### Baseline (before fixes)

```
✖ 13 problems (3 errors, 10 warnings)
```

| # | File | Rule | Severity | Description |
|---|------|------|----------|-------------|
| 1 | `person/[id]/page.tsx` | `react-hooks/purity` | error | `Date.now()` in render |
| 2 | `person/[id]/page.tsx` | `react-hooks/purity` | error | `Date.now()` in render |
| 3 | `list-comments.tsx` | `react-hooks/purity` | error | `Date.now()` in render |
| 4 | `ai-suggestions.tsx` | `no-unused-vars` | warning | Unused `Badge` import |
| 5 | `fork-button.tsx` | `no-unused-vars` | warning | Unused `useState` import |
| 6 | `generate-description/route.ts` | `consistent-type-imports` | warning | Should use `import type` |
| 7 | `list-suggestions/route.ts` | `consistent-type-imports` | warning | Should use `import type` |
| 8 | `recommendations/route.ts` | `consistent-type-imports` | warning | Should use `import type` |
| 9 | `movies/[id]/route.ts` | `consistent-type-imports` | warning | Should use `import type` |
| 10 | `movies/discover/route.ts` | `consistent-type-imports` | warning | Should use `import type` |
| 11 | `movies/search/route.ts` | `consistent-type-imports` | warning | Should use `import type` |
| 12 | `webhooks/clerk/route.ts` | `consistent-type-imports` | warning | Should use `import type` |
| 13 | `fork-button.tsx` | `no-unused-vars` | warning | Unused `useState` |

### After initial fixes (3 issues fixed — all errors)

```
✖ 10 problems (0 errors, 10 warnings)
Fixed: #1, #2, #3
```

## Git Hooks

Pre-commit hooks run ESLint and TypeScript check automatically before each commit.

Setup via Husky:

```bash
# Install (already configured in package.json)
npm install

# Hooks are in .husky/ directory
# pre-commit: runs npm run quality
```

## Build Integration

The `npm run quality` command runs all checks in sequence:

```bash
npm run quality
# Equivalent to: eslint . && tsc --noEmit && prettier --check "**/*.{ts,tsx}"
```

The production build (`npm run build`) also runs type checking as part of the Next.js build process.

## Static Type Checking

TypeScript is configured in `tsconfig.json` with strict mode. Run standalone type check:

```bash
npm run typecheck    # tsc --noEmit
```

TypeScript catches issues that ESLint cannot, such as:
- Type mismatches between function arguments and parameters
- Missing required properties on objects
- Incorrect return types
- Null/undefined safety violations
