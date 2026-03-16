import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('protocol report', () => {
  it('report readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-protocol-report', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
