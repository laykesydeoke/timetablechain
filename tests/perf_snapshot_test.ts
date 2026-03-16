import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('perf snapshot', () => {
  it('performance after snapshot', () => {
    simnet.callPublicFn('timetablechain', 'take-protocol-snapshot', [], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'get-performance-stats', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
