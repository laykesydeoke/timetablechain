import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('teacher governance', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('governance params readable after teacher auth', () => {
    simnet.callPublicFn('timetablechain', 'authorize-teacher', [Cl.standardPrincipal(alice)], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], alice);
    expect(r.result).not.toBeNone(); }); });
