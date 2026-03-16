import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('perf emergency', () => {
  it('performance readable during pause', () => {
    simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'get-performance-stats', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
