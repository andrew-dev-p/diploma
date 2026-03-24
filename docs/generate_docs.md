# Documentation Generation Guide

## Overview

CineList uses **TypeDoc** to generate HTML API documentation from TSDoc comments in the source code.

## Tools

| Tool | Version | Purpose |
|------|---------|---------|
| [TypeDoc](https://typedoc.org/) | 0.28+ | Generates HTML docs from TypeScript source |
| [eslint-plugin-jsdoc](https://github.com/gajus/eslint-plugin-jsdoc) | 54+ | Lints JSDoc/TSDoc comment quality |

## Configuration

TypeDoc configuration is in `typedoc.json` at the project root:

```json
{
  "entryPoints": ["lib/ai.ts", "lib/db.ts", "lib/tmdb.ts", ...],
  "out": "docs-generated",
  "name": "CineList API Documentation"
}
```

Entry points cover all `lib/` modules — the core business logic and API layers.

## Generating Documentation

### Generate HTML docs

```bash
npm run docs
```

Output is written to `docs-generated/` (gitignored). Open `docs-generated/index.html` in a browser.

### Check documentation quality

```bash
npm run docs:check
```

Runs TypeDoc in validation mode — reports warnings about missing or malformed documentation without generating output. Treats warnings as errors.

### Lint documentation comments

```bash
npm run lint
```

ESLint with `eslint-plugin-jsdoc` checks all `lib/**/*.ts` files for:
- Missing JSDoc on public functions (`jsdoc/require-jsdoc`)
- Missing descriptions (`jsdoc/require-description`)
- Missing `@param` descriptions (`jsdoc/require-param-description`)
- Missing `@returns` descriptions (`jsdoc/require-returns-description`)
- Invalid param names (`jsdoc/check-param-names`)
- Invalid tag names (`jsdoc/check-tag-names`)

## Documentation Standards

### Required for every exported function

```ts
/**
 * Short description of what the function does.
 * @param paramName - Description of the parameter
 * @returns Description of the return value
 * @throws Error description (when applicable)
 * @example
 * ```ts
 * const result = await myFunction("input")
 * ```
 */
```

### Required for every module

```ts
/**
 * @module moduleName
 * @description What this module provides and its role in the architecture.
 */
```

### Required for interfaces with non-obvious fields

```ts
/** Represents a movie from the TMDB API. */
export interface TMDBMovie {
  /** TMDB unique identifier */
  id: number
  /** Original release date in YYYY-MM-DD format */
  release_date: string
}
```

## CI/CD Integration

Documentation is automatically generated and published to GitHub Pages on every push to `main` via the `.github/workflows/docs.yml` workflow.

Live documentation: https://andrew-dev-p.github.io/diploma/

## Adding New Documented Files

1. Add TSDoc comments to your new file
2. Add the file path to `typedoc.json` → `entryPoints`
3. Run `npm run docs:check` to verify
4. Run `npm run docs` to preview locally
