import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('is authorized', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('unauthorized teacher returns false', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'is-teacher-authorized', [Cl.standardPrincipal(alice)], simnet.deployer);
    expect(r.result).toBeFalse(); }); });
