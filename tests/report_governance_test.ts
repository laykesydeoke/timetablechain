import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('report governance', () => {
  it('report and governance coexist', () => {
    const report = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], simnet.deployer);
    const gov = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], simnet.deployer);
    expect(report.result).not.toBeNone();
    expect(gov.result).not.toBeNone(); }); });
