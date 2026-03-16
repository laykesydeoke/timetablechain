import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('governance large value', () => {
  it('max slots can be very large', () => {
    const r = simnet.callPublicFn('timetablechain', 'set-max-slots-per-teacher', [Cl.uint(9999)], simnet.deployer);
    expect(r.result).toBeOk(Cl.bool(true)); }); });
