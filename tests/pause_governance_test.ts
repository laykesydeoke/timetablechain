import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('pause governance', () => {
  it('pause and governance coexist', () => {
    const gov = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], simnet.deployer);
    const paused = simnet.callReadOnlyFn('timetablechain', 'is-paused', [], simnet.deployer);
    expect(gov.result).not.toBeNone();
    expect(paused.result).not.toBeNone(); }); });
