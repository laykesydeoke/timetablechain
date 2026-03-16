import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('tier name deployer', () => {
  it('deployer tier name readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier-name', [Cl.standardPrincipal(simnet.deployer)], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
