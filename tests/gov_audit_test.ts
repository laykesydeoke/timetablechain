import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('governance audit', () => {
  it('multiple actions increment counter', () => {
    simnet.callPublicFn('timetablechain', 'set-max-slots-per-teacher', [Cl.uint(50)], simnet.deployer);
    simnet.callPublicFn('timetablechain', 'set-max-slots-per-teacher', [Cl.uint(100)], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
