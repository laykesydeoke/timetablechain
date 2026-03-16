import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('multi pause', () => {
  it('multiple pause/resume cycles work', () => {
    simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    simnet.callPublicFn('timetablechain', 'emergency-resume', [], simnet.deployer);
    const r = simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    expect(r.result).toBeOk(Cl.bool(true)); }); });
