import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('performance public', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('performance stats public', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-performance-stats', [], alice);
    expect(r.result).not.toBeNone(); }); });
