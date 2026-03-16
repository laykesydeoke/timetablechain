import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('total slots', () => {
  it('total slots field present', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
