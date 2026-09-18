// NOTE: `import "@testing-library/jest-dom/vitest"` (the officially
// documented setup) resolves a *different* module instance of "vitest"
// than the one used by test files in this environment (Vite appears to
// pre-bundle jest-dom's prebuilt vitest.mjs separately from the
// SSR-externalized "vitest" import used elsewhere), so `expect.extend()`
// silently attaches matchers to a chai instance that test files never see
// ("Invalid Chai property: toBeInTheDocument" etc.). Importing the
// matchers directly and extending the same `expect` that test files
// import from "vitest" avoids the dual-module-instance issue.
//
// The type-only import below is separate from the above runtime concern:
// it's fully erased at compile time (no JS emitted, so it can't create a
// second module instance), and it's only there to pull in jest-dom's
// TypeScript module augmentation of vitest's `Assertion`/
// `AsymmetricMatchersContaining` interfaces (`toBeInTheDocument()` etc.)
// so `tsc`/`next build`'s type-check recognizes the matchers that
// `expect.extend(matchers)` below actually registers at runtime. Without
// it, the runtime behavior is correct but the type-check fails with
// "Property 'toBeInTheDocument' does not exist on type 'Assertion<...>'"
// across every test file that uses a jest-dom matcher.
import type {} from "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);
