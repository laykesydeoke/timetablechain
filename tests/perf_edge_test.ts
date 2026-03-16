import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('perf edge', () => {
  it('performance stable with no activity', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-performance-stats', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
