import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("categ int", () => { it("works", () => { const r = simnet.callReadOnlyFn("timetablechain", "get-category-stats", [], simnet.deployer); expect(r.result).not.toBeNone(); }); });
