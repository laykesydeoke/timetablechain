import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('uptime public', () => {
  const accounts = simnet.getAccounts();
  const alice = accounts.get('wallet_1')!;
  it('uptime readable by all', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-protocol-uptime', [], alice);
    expect(r.result).not.toBeNone(); }); });
