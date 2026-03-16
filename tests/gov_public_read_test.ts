import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('governance public read', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('anyone can read governance params', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], alice);
    expect(r.result).not.toBeNone(); }); });
