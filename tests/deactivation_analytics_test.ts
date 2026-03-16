import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('deactivation analytics', () => {
  it('deactivation count in analytics', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
