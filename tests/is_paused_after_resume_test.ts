import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('is paused after resume', () => {
  it('is-paused false after resume', () => {
    simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    simnet.callPublicFn('timetablechain', 'emergency-resume', [], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'is-paused', [], simnet.deployer);
    expect(r.result).toBeFalse(); }); });
