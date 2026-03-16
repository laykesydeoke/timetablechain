import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('tier level boundaries', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('tier 1 starts at 0 slots', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier', [Cl.standardPrincipal(alice)], alice);
    expect(r.result).toBeUint(1); }); });
