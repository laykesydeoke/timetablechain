import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('governance summary', () => {
  it('complete governance lifecycle', () => {
    simnet.callPublicFn('timetablechain', 'set-max-slots-per-teacher', [Cl.uint(150)], simnet.deployer);
    const params = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], simnet.deployer);
    const analytics = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], simnet.deployer);
    expect(params.result).not.toBeNone();
    expect(analytics.result).not.toBeNone(); }); });
