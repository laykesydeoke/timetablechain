import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('perf market', () => {
  it('performance and market coexist', () => {
    const perf = simnet.callReadOnlyFn('timetablechain', 'get-performance-stats', [], simnet.deployer);
    const market = simnet.callReadOnlyFn('timetablechain', 'get-marketplace-metrics', [], simnet.deployer);
    expect(perf.result).not.toBeNone();
    expect(market.result).not.toBeNone(); }); });
