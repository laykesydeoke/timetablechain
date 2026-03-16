import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market snapshot', () => {
  it('market metrics after snapshot', () => {
    simnet.callPublicFn('timetablechain', 'take-protocol-snapshot', [], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'get-marketplace-metrics', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
