import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market analytics coexist', () => {
  it('market and slot analytics coexist', () => {
    const market = simnet.callReadOnlyFn('timetablechain', 'get-marketplace-metrics', [], simnet.deployer);
    const slots = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], simnet.deployer);
    expect(market.result).not.toBeNone();
    expect(slots.result).not.toBeNone(); }); });
