import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('analytics public', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('analytics readable by all', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], alice);
    expect(r.result).not.toBeNone(); }); });
