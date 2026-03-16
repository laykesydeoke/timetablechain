import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('authorize teacher', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('owner can authorize teacher', () => {
    const r = simnet.callPublicFn('timetablechain', 'authorize-teacher', [Cl.standardPrincipal(alice)], simnet.deployer);
    expect(r.result).toBeOk(Cl.bool(true)); }); });
