import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('pause governance', () => {
  it('pause and governance coexist', () => {
    const pause = simnet.callReadOnlyFn('timetablechain', 'get-pause-state', [], simnet.deployer);
    const gov = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], simnet.deployer);
    expect(pause.result).not.toBeNone();
    expect(gov.result).not.toBeNone(); }); });
