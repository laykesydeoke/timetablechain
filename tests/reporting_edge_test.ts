import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('reporting edge', () => {
  it('report readable with no activity', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
