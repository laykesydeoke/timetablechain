import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('nonexistent snapshot', () => {
  it('nonexistent snapshot returns none', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-protocol-snapshot', [Cl.uint(999)], simnet.deployer);
    expect(r.result).toBeNone(); }); });
