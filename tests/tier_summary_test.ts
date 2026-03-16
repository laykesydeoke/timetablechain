import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('tier summary', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('complete tier lifecycle', () => {
    const tier = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier', [Cl.standardPrincipal(alice)], alice);
    const name = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier-name', [Cl.standardPrincipal(alice)], alice);
    const bonus = simnet.callReadOnlyFn('timetablechain', 'get-teacher-bonus-bps', [Cl.standardPrincipal(alice)], alice);
    expect(tier.result).toBeUint(1);
    expect(name.result).not.toBeNone();
    expect(bonus.result).toBeUint(0); }); });
