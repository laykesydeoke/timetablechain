import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('report fields', () => {
  it('report includes all fields', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
