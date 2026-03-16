import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market edge', () => {
  it('market metrics stable with no slots', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-marketplace-metrics', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
