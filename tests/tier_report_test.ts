import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('tier report', () => {
  it('tier and report coexist', () => {
    const tier = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier', [Cl.standardPrincipal(simnet.deployer)], simnet.deployer);
    const report = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], simnet.deployer);
    expect(tier.result).not.toBeNone();
    expect(report.result).not.toBeNone(); }); });
