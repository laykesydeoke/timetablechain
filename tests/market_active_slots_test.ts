import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market active slots', () => {
  it('active slots field in metrics', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-marketplace-metrics', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
