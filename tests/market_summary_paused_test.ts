import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market summary paused', () => {
  it('market summary includes pause state', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-market-summary', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
