import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
const accounts = simnet.getAccounts();
const alice = accounts.get("wallet_1")!;
describe("emergency full", () => {
  it("complete emergency lifecycle", () => {
    const initial = simnet.callReadOnlyFn("timetablechain", "is-paused", [], alice);
    simnet.callPublicFn("timetablechain", "emergency-pause", [], simnet.deployer);
    const paused = simnet.callReadOnlyFn("timetablechain", "is-paused", [], alice);
    const state = simnet.callReadOnlyFn("timetablechain", "get-pause-state", [], alice);
    simnet.callPublicFn("timetablechain", "emergency-resume", [], simnet.deployer);
    const resumed = simnet.callReadOnlyFn("timetablechain", "is-paused", [], alice);
    expect(initial.result).toBeFalse();
    expect(paused.result).toBeTrue();
    expect(state.result).not.toBeNone();
    expect(resumed.result).toBeFalse();
  });
});
