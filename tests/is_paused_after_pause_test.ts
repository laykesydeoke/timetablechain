import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('is paused after pause', () => {
  it('is-paused true after emergency-pause', () => {
    simnet.callPublicFn('timetablechain', 'emergency-pause', [], simnet.deployer);
    const r = simnet.callReadOnlyFn('timetablechain', 'is-paused', [], simnet.deployer);
    expect(r.result).toBeTrue(); }); });
