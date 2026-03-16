import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('analytics integration', () => {
  it('analytics and paused state coexist', () => {
    const analytics = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], simnet.deployer);
    const paused = simnet.callReadOnlyFn('timetablechain', 'is-paused', [], simnet.deployer);
    expect(analytics.result).not.toBeNone();
    expect(paused.result).not.toBeNone(); }); });
