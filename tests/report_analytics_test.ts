import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('report analytics', () => {
  it('report and analytics coexist', () => {
    const report = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], simnet.deployer);
    const analytics = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], simnet.deployer);
    expect(report.result).not.toBeNone();
    expect(analytics.result).not.toBeNone(); }); });
