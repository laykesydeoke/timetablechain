import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('analytics summary', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('full analytics flow readable', () => {
    simnet.callPublicFn('timetablechain', 'authorize-teacher', [Cl.standardPrincipal(alice)], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], alice);
    expect(r.result).not.toBeNone(); }); });
