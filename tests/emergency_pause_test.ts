import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('emergency pause', () => {
  it('owner can emergency pause', () => {
    const r = simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    expect(r.result).toBeOk(Cl.bool(true)); }); });
