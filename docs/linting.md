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
Calculation: 3/13 = 23%
```

### After 50% fix pass (auto-fix + manual)

```
✖ 0 problems
Fixed: all remaining — #4 through #13
Calculation: 13/13 = 100% ≥ 50% ✓
```

**How 50% was determined:**
- Auto-fix (`eslint --fix`) resolved 7 issues (#6–#12: consistent-type-imports) = 54%
- Manual fix resolved remaining 3 (#4 unused Badge, #5 unused useState, #13 impure Date.now)
- Total: 13/13 = 100% ≥ 50% ✓

### After 90% fix pass

Same as above — all 13/13 issues resolved = 100% ≥ 90% ✓

**How 90% was determined:**
- Baseline: 13 issues (counted by running `npx eslint .`)
- After fixes: 0 issues (confirmed by running `npx eslint .`)
- 13/13 fixed = 100% ≥ 90% ✓

### Final state

```bash
$ npx eslint .
# (no output — 0 issues)

$ npx tsc --noEmit
# (no output — 0 type errors)

$ npx prettier --check "**/*.{ts,tsx}"
# Checking formatting...
# All matched files use Prettier code style!
```

## Git Hooks

Pre-commit hooks automatically run the full quality check before each commit, preventing code with lint errors, type errors, or formatting issues from being committed.

### Setup

Husky is configured via the `prepare` script in `package.json`. Hooks are installed automatically when running `npm install`:

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

### Pre-commit hook

File: `.husky/pre-commit`

```bash
npm run quality
```

This runs ESLint + TypeScript check + Prettier check. If any check fails, the commit is rejected.

### How it works

1. Developer runs `git commit`
2. Husky intercepts and runs `.husky/pre-commit`
3. `npm run quality` runs:
   - `eslint .` — linting (0 errors required)
   - `tsc --noEmit` — type checking (0 errors required)
   - `prettier --check` — formatting (all files must match)
4. If all pass → commit proceeds
5. If any fails → commit is rejected with error output

## Build Integration

### Quality check script

The `npm run quality` command runs all static analysis in sequence:

```bash
npm run quality
# Runs: eslint . && tsc --noEmit && prettier --check "**/*.{ts,tsx}"
```

### Pre-build hook

The `prebuild` script in `package.json` runs linting and type checking before every production build:

```json
{
  "scripts": {
    "prebuild": "eslint . && tsc --noEmit",
    "build": "next build"
  }
}
```

When you run `npm run build`, npm automatically runs `prebuild` first. If linting or type checking fails, the build is aborted.

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run typecheck` | Run TypeScript type check |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without modifying |
| `npm run quality` | Full check: lint + typecheck + format |
| `npm run build` | Build (runs prebuild checks first) |

## Static Type Checking

TypeScript is the primary language of the project. Type checking is enforced at multiple levels:

### Configuration

TypeScript is configured in `tsconfig.json`. The Next.js default config provides strict type checking.

### Running type check

```bash
npm run typecheck    # tsc --noEmit
```

### What TypeScript catches

TypeScript catches issues that ESLint cannot:

- Type mismatches between function arguments and parameters
- Missing required properties on objects/interfaces
- Incorrect return types from functions
- Null/undefined safety violations
- Invalid property access on typed objects
- Incompatible types in assignments
- Missing generic type parameters

### Integration points

| Where | How |
|-------|-----|
| Pre-commit hook | `npm run quality` includes `tsc --noEmit` |
| Pre-build | `npm run prebuild` includes `tsc --noEmit` |
| IDE | Real-time type errors in VS Code / WebStorm |
| CI (if configured) | Can run `npm run quality` in GitHub Actions |
