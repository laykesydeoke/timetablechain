import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('governance update', () => {
  it('max slots can be updated multiple times', () => {
    simnet.callPublicFn('timetablechain', 'set-max-slots-per-teacher', [Cl.uint(50)], simnet.deployer);
    const r = simnet.callPublicFn('timetablechain', 'set-max-slots-per-teacher', [Cl.uint(200)], simnet.deployer);
    expect(r.result).toBeOk(Cl.bool(true)); }); });
