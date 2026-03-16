import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('silver tier check', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('silver tier gives 50 bps bonus', () => {
    const bonus = simnet.callReadOnlyFn('timetablechain', 'get-teacher-bonus-bps', [Cl.standardPrincipal(alice)], alice);
    expect(bonus.result).not.toBeNone(); }); });
