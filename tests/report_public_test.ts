import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('report public', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('report readable by all', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], alice);
    expect(r.result).not.toBeNone(); }); });
