import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('tier invariant', () => {
  it('deployer starts at tier 1', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier', [Cl.standardPrincipal(simnet.deployer)], simnet.deployer);
    expect(r.result).toBeUint(1); }); });
