import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market gov coexist', () => {
  it('market and governance coexist', () => {
    const market = simnet.callReadOnlyFn('timetablechain', 'get-marketplace-metrics', [], simnet.deployer);
    const gov = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], simnet.deployer);
    expect(market.result).not.toBeNone();
    expect(gov.result).not.toBeNone(); }); });
