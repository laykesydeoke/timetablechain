import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('snapshot create', () => {
  it('anyone can take snapshot', () => {
    const accounts = simnet.getAccounts();
    const alice = accounts.get('wallet_1')!;
    const r = simnet.callPublicFn('timetablechain', 'take-protocol-snapshot', [], alice);
    expect(r.result).toBeOk(Cl.uint(0)); }); });
