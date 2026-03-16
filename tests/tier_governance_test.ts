import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('tier governance', () => {
  it('tier and governance coexist', () => {
    const tier = simnet.callReadOnlyFn('timetablechain', 'get-teacher-tier', [Cl.standardPrincipal(simnet.deployer)], simnet.deployer);
    const gov = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], simnet.deployer);
    expect(tier.result).not.toBeNone();
    expect(gov.result).not.toBeNone(); }); });
