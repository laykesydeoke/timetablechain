import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market full', () => {
  it('complete marketplace analytics lifecycle', () => {
    simnet.callPublicFn('timetablechain', 'take-protocol-snapshot', [], simnet.deployer);
    const metrics = simnet.callReadOnlyFn('timetablechain', 'get-marketplace-metrics', [], simnet.deployer);
    const summary = simnet.callReadOnlyFn('timetablechain', 'get-market-summary', [], simnet.deployer);
    expect(metrics.result).not.toBeNone();
    expect(summary.result).not.toBeNone(); }); });
