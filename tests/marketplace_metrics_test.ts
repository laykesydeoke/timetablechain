import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('marketplace metrics', () => {
  it('marketplace metrics readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-marketplace-metrics', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
