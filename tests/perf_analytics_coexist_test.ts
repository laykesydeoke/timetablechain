import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('perf analytics coexist', () => {
  it('performance and analytics coexist', () => {
    const perf = simnet.callReadOnlyFn('timetablechain', 'get-performance-stats', [], simnet.deployer);
    const analytics = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], simnet.deployer);
    expect(perf.result).not.toBeNone();
    expect(analytics.result).not.toBeNone(); }); });
