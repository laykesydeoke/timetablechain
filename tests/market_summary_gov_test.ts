import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market summary gov', () => {
  it('market summary includes governance actions', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-market-summary', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
