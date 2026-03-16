import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('pause initial', () => {
  it('not paused initially', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'is-paused', [], simnet.deployer);
    expect(r.result).toBeFalse(); }); });
