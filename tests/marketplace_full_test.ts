import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
const accounts = simnet.getAccounts();
const alice = accounts.get("wallet_1")!;
describe("marketplace full", () => {
  it("complete marketplace analytics lifecycle", () => {
    simnet.callPublicFn("timetablechain", "take-protocol-snapshot", [], simnet.deployer);
    const metrics = simnet.callReadOnlyFn("timetablechain", "get-marketplace-metrics", [], alice);
    const summary = simnet.callReadOnlyFn("timetablechain", "get-market-summary", [], alice);
    const tier = simnet.callReadOnlyFn("timetablechain", "get-teacher-tier", [Cl.standardPrincipal(alice)], alice);
    const gov = simnet.callReadOnlyFn("timetablechain", "get-governance-params", [], alice);
    expect(metrics.result).not.toBeNone();
    expect(summary.result).not.toBeNone();
    expect(tier.result).not.toBeNone();
    expect(gov.result).not.toBeNone();
  });
});
