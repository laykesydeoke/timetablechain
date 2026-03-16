import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('perf full', () => {
  it('complete performance tracking lifecycle', () => {
    const stats = simnet.callReadOnlyFn('timetablechain', 'get-performance-stats', [], simnet.deployer);
    const uptime = simnet.callReadOnlyFn('timetablechain', 'get-protocol-uptime', [], simnet.deployer);
    const analytics = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], simnet.deployer);
    expect(stats.result).not.toBeNone();
    expect(uptime.result).not.toBeNone();
    expect(analytics.result).not.toBeNone(); }); });
