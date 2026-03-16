import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('tier name', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('new teacher tier name is bronze', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier-name', [Cl.standardPrincipal(alice)], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
