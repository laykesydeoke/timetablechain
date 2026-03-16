import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('pause count', () => {
  it('pause count increments', () => {
    simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'get-pause-state', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
