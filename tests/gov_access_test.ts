import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('gov access', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('non-owner cannot set max slots', () => {
    const r = simnet.callPublicFn('timetablechain', 'set-max-slots-per-teacher', [Cl.uint(50)], alice);
    expect(r.result).toBeErr(Cl.uint(401)); }); });
