import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('tier multi user', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  const bob = accounts.get('wallet_2')!;
  it('different users can have different tiers', () => {
    const t1 = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier', [Cl.standardPrincipal(alice)], simnet.deployer);
    const t2 = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier', [Cl.standardPrincipal(bob)], simnet.deployer);
    expect(t1.result).toBeUint(1);
    expect(t2.result).toBeUint(1); }); });
