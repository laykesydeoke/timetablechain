import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market summary', () => {
  it('market summary readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-market-summary', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
