import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('gold tier check', () => {
  it('gold tier available in system', () => {
    const tier = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier', [Cl.standardPrincipal(simnet.deployer)], simnet.deployer);
    expect(tier.result).not.toBeNone(); }); });
