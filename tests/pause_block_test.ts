import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('pause block', () => {
  it('pause block recorded', () => {
    simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'get-pause-state', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
