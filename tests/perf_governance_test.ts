import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('perf governance', () => {
  it('performance and governance coexist', () => {
    const perf = simnet.callReadOnlyFn('timetablechain', 'get-performance-stats', [], simnet.deployer);
    const gov = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], simnet.deployer);
    expect(perf.result).not.toBeNone();
    expect(gov.result).not.toBeNone(); }); });
