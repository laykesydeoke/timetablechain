import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('pause state', () => {
  it('pause state readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-pause-state', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
