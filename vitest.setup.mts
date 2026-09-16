// NOTE: `import "@testing-library/jest-dom/vitest"` (the officially
// documented setup) resolves a *different* module instance of "vitest"
// than the one used by test files in this environment (Vite appears to
// pre-bundle jest-dom's prebuilt vitest.mjs separately from the
// SSR-externalized "vitest" import used elsewhere), so `expect.extend()`
// silently attaches matchers to a chai instance that test files never see
// ("Invalid Chai property: toBeInTheDocument" etc.). Importing the
// matchers directly and extending the same `expect` that test files
// import from "vitest" avoids the dual-module-instance issue.
import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);
