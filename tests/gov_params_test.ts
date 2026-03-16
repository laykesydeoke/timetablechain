import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('governance params', () => {
  it('governance params readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-governance-params', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
