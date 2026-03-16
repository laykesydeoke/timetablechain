import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('snapshot sequential', () => {
  it('snapshot IDs are sequential', () => {
    const s1 = simnet.callPublicFn('timetablechain', 'take-protocol-snapshot', [], simnet.deployer);
    const s2 = simnet.callPublicFn('timetablechain', 'take-protocol-snapshot', [], simnet.deployer);
    expect(s1.result).toBeOk(Cl.uint(0));
    expect(s2.result).toBeOk(Cl.uint(1)); }); });
