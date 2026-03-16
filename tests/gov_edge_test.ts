import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('governance edge', () => {
  it('max slots can be set to 1', () => {
    const r = simnet.callPublicFn('timetablechain', 'set-max-slots-per-teacher', [Cl.uint(1)], simnet.deployer);
    expect(r.result).toBeOk(Cl.bool(true)); }); });
