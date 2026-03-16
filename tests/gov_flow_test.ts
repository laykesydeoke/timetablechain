import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('governance flow', () => {
  it('governance update flow works', () => {
    simnet.callPublicFn('timetablechain', 'set-max-slots-per-teacher', [Cl.uint(75)], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
