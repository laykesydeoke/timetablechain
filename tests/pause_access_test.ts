import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('pause access', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('non-owner cannot emergency pause', () => {
    const r = simnet.callPublicFn('timetablechain', 'emergency-pause', [], alice);
    expect(r.result).toBeErr(Cl.uint(401)); }); });
