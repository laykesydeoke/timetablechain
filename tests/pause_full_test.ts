import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('pause full', () => {
  it('complete pause lifecycle', () => {
    simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    const state = simnet.callReadOnlyFn('timetablechain', 'get-pause-state', [], simnet.deployer);
    const paused = simnet.callReadOnlyFn('timetablechain', 'is-paused', [], simnet.deployer);
    simnet.callPublicFn('timetablechain', 'emergency-resume', [], simnet.deployer);
    const resumed = simnet.callReadOnlyFn('timetablechain', 'is-paused', [], simnet.deployer);
    expect(state.result).not.toBeNone();
    expect(paused.result).toBeTrue();
    expect(resumed.result).toBeFalse(); }); });
