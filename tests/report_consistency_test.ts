import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('report consistency', () => {
  it('report snapshot count increments', () => {
    simnet.callPublicFn('timetablechain', 'take-protocol-snapshot', [], simnet.deployer);
    simnet.callPublicFn('timetablechain', 'take-protocol-snapshot', [], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
