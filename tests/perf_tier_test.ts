import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('perf tier', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('performance and tier coexist', () => {
    const perf = simnet.callReadOnlyFn('timetablechain', 'get-performance-stats', [], simnet.deployer);
    const tier = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier', [Cl.standardPrincipal(alice)], alice);
    expect(perf.result).not.toBeNone();
    expect(tier.result).not.toBeNone(); }); });
