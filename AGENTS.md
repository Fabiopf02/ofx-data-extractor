# AGENTS.md - ofx-data-extractor

## Goal
Speed up agent onboarding and reduce full-repo scanning by providing a stable operational map of this package.

## Project Type
TypeScript library for OFX parsing, normalization and validation (Node.js + Browser).

## First Files To Read (in order)
1. `README.md` (public behavior and examples)
2. `src/index.ts` (public exports)
3. `src/older-implementation/main.ts` (public `Ofx` facade)
4. `src/implementations/extractor.ts` (runtime orchestration + parser modes)
5. `src/implementations/ofx-extractor.ts` (OFX extraction implementation)
6. `src/common/analysis.ts` (normalization + validation)
7. `src/common/date.ts` (date parsing/validation)

## Stable Public API (v1.x)
Treat these as stable contracts:
- `Ofx`
  - `fromBuffer`, `fromBlob`, `config`, `getType`, `getHeaders`
  - `getBankTransferList`, `getCreditCardTransferList`, `getTransactionsSummary`
  - `getContent`, `toJson`
  - `toNormalized`, `validate`, `getWarnings`

Do not remove or change method signatures in v1.x.
Additive changes only.

## Parser Modes
- `strict` (default): throws on parse failures.
- `lenient`: recovers with fallback and accumulates diagnostics (`PARSE_ERROR`, etc.).

## Main Source Map
- Public exports: `src/index.ts`
- Public facade: `src/older-implementation/main.ts`
- Core orchestrator: `src/implementations/extractor.ts`
- OFX implementation: `src/implementations/ofx-extractor.ts`
- Parse helpers: `src/common/parse.ts`
- Normalize/validate: `src/common/analysis.ts`
- Date handling: `src/common/date.ts`
- Runtime reader: `src/common/reader.ts`, `src/implementations/reader.ts`
- Types: `src/@types/**`

## Test Map
- Legacy compatibility + snapshots: `tests/ofx.spec.ts`, `tests/new-ofx.spec.ts`
- Reader/browser behavior: `tests/file-reader*.spec.ts`
- Modern API behavior: `tests/modern-api.spec.ts`
- Resilience/diagnostics branches: `tests/resilience.spec.ts`
- Date edge cases: `tests/date-utils.spec.ts`

## Minimal Validation Commands
Run these before finishing any change:
- `npm run lint`
- `npm test -- --runInBand`
- `npm run build`

For coverage-focused work:
- `npm run test:coverage -- --runInBand`

## Change Routing (Where to edit)
- New user-facing behavior/API: `main.ts` + `extractor.ts` + `index.ts` + README/tests.
- OFX extraction behavior: `ofx-extractor.ts` and/or `parse.ts`.
- Date semantics: `date.ts` first; avoid duplicating date logic elsewhere.
- Validation/normalization semantics: `analysis.ts`.
- New contract types: `src/@types/common.ts` and related interfaces.

## Naming & Organization Rules
- Prefer behavior-oriented names (`resilience`, `modern-api`, `date-utils`) over meta names (`coverage-gaps`).
- Keep tests aligned with feature intent.
- Keep additive API naming clear and explicit.

## Documentation/Release Rules
When behavior changes:
1. Update `README.md` (API + examples + guarantees/limits when relevant)
2. Update `CHANGELOG.md` sections including explicit `Breaking Changes`
3. Keep `.github/RELEASE_TEMPLATE.md` structure

## Guardrails
- Do not introduce breaking changes in v1.x.
- Do not silently change output shapes of existing methods.
- Do not bypass tests/lint/build checks.
- Avoid broad refactors without targeted tests.

## Known Build Note
Rollup currently warns that `dist/index.d.ts` is overwritten during build. This is known behavior in current setup.
