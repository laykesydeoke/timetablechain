import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('market tier coexist', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('market and tier coexist', () => {
    const market = simnet.callReadOnlyFn('timetablechain', 'get-marketplace-metrics', [], simnet.deployer);
    const tier = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier', [Cl.standardPrincipal(alice)], alice);
    expect(market.result).not.toBeNone();
    expect(tier.result).not.toBeNone(); }); });
