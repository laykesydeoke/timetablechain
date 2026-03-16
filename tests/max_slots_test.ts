import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('max slots governance', () => {
  it('owner can set max slots', () => {
    const r = simnet.callPublicFn('timetablechain', 'set-max-slots-per-teacher', [Cl.uint(50)], simnet.deployer);
    expect(r.result).toBeOk(Cl.bool(true)); }); });
