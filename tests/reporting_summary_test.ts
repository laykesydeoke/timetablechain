import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('reporting summary', () => {
  it('complete reporting lifecycle', () => {
    const s = simnet.callPublicFn('timetablechain', 'take-protocol-snapshot', [], simnet.deployer);
    const snap = simnet.callReadOnlyFn('timetablechain', 'get-protocol-snapshot', [Cl.uint(0)], simnet.deployer);
    const report = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], simnet.deployer);
    expect(s.result).toBeOk(Cl.uint(0));
    expect(snap.result).not.toBeNone();
    expect(report.result).not.toBeNone(); }); });
