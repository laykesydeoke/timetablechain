import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('slot analytics', () => {
  it('analytics readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
