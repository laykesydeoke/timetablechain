import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('is paused', () => {
  it('paused state readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'is-paused', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
