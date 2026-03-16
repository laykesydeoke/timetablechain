import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('tier bonus deployer', () => {
  it('deployer bonus bps readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-teacher-bonus-bps', [Cl.standardPrincipal(simnet.deployer)], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
