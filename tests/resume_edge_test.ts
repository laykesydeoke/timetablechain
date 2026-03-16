import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('resume edge', () => {
  it('resume when not paused works', () => {
    const r = simnet.callPublicFn('timetablechain', 'emergency-resume', [], simnet.deployer);
    expect(r.result).toBeOk(Cl.bool(true)); }); });
