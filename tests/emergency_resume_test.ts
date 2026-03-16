import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('emergency resume', () => {
  it('owner can resume', () => {
    simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    const r = simnet.callPublicFn('timetablechain', 'emergency-resume', [], simnet.deployer);
    expect(r.result).toBeOk(Cl.bool(true)); }); });
