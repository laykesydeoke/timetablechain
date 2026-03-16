import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market summary public', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('market summary readable by all', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-market-summary', [], alice);
    expect(r.result).not.toBeNone(); }); });
