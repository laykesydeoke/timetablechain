import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market report coexist', () => {
  it('market and protocol report coexist', () => {
    const market = simnet.callReadOnlyFn('timetablechain', 'get-marketplace-metrics', [], simnet.deployer);
    const report = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], simnet.deployer);
    expect(market.result).not.toBeNone();
    expect(report.result).not.toBeNone(); }); });
