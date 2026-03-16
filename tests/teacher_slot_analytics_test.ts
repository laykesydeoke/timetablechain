import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('teacher slot analytics', () => {
  it('teacher count accessible', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-teacher-count', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
