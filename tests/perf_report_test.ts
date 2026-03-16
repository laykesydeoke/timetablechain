import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('perf report', () => {
  it('performance and report coexist', () => {
    const perf = simnet.callReadOnlyFn('timetablechain', 'get-performance-stats', [], simnet.deployer);
    const report = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], simnet.deployer);
    expect(perf.result).not.toBeNone();
    expect(report.result).not.toBeNone(); }); });
