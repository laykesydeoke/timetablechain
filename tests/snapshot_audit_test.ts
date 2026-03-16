import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('snapshot audit', () => {
  it('snapshots provide audit trail', () => {
    simnet.callPublicFn('timetablechain', 'take-protocol-snapshot', [], simnet.deployer);
    const s = simnet.callReadOnlyFn('timetablechain', 'get-protocol-snapshot', [Cl.uint(0)], simnet.deployer);
    expect(s.result).not.toBeNone(); }); });
