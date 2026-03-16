import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('tier bonus', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('bronze tier has 0 bps bonus', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-teacher-bonus-bps', [Cl.standardPrincipal(alice)], simnet.deployer);
    expect(r.result).toBeUint(0); }); });
