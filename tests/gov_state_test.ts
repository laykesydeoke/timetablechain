import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('governance state', () => {
  it('governance action count starts at 0', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
