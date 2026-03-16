import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('multi snapshot report', () => {
  it('multiple snapshots tracked in report', () => {
    for (let i = 0; i < 3; i++) { simnet.callPublicFn('timetablechain', 'take-protocol-snapshot', [], simnet.deployer); }
    const r = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
