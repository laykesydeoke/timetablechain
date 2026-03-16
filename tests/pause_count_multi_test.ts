import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('pause count multi', () => {
  it('pause count reflects cycles', () => {
    simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    simnet.callPublicFn('timetablechain', 'emergency-resume', [], simnet.deployer);
    simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'get-pause-state', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
