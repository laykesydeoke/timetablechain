import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('pause invariant', () => {
  it('pause state always readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-pause-state', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
