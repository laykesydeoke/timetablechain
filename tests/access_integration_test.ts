import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("access control integration", () => {
  it("access summary integrates with all modules", () => {
    const summary = simnet.callReadOnlyFn("timetablechain", "get-access-summary", [], simnet.deployer);
    const perf = simnet.callReadOnlyFn("timetablechain", "get-performance-stats", [], simnet.deployer);
    const market = simnet.callReadOnlyFn("timetablechain", "get-marketplace-metrics", [], simnet.deployer);
    expect(summary.result).not.toBeNone();
    expect(perf.result).not.toBeNone();
    expect(market.result).not.toBeNone();
  });
});
