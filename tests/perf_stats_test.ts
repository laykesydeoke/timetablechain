import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('performance stats', () => {
  it('performance stats readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-performance-stats', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
