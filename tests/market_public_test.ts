import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market public', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('market metrics readable by all', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-marketplace-metrics', [], alice);
    expect(r.result).not.toBeNone(); }); });
