import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('resume access', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('non-owner cannot resume', () => {
    simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    const r = simnet.callPublicFn('timetablechain', 'emergency-resume', [], alice);
    expect(r.result).toBeErr(Cl.uint(401)); }); });
