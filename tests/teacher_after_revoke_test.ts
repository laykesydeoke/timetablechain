import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('teacher after revoke', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('teacher not authorized after revoke', () => {
    simnet.callPublicFn('timetablechain', 'authorize-teacher', [Cl.standardPrincipal(alice)], simnet.deployer);
    simnet.callPublicFn('timetablechain', 'revoke-teacher', [Cl.standardPrincipal(alice)], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'is-teacher-authorized', [Cl.standardPrincipal(alice)], simnet.deployer);
    expect(r.result).toBeFalse(); }); });
