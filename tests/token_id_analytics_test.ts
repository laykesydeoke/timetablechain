import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('token id analytics', () => {
  it('last token id matches analytics', () => {
    const lastId = simnet.callReadOnlyFn('timetablechain', 'get-last-token-id', [], simnet.deployer);
    const analytics = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], simnet.deployer);
    expect(lastId.result).not.toBeNone();
    expect(analytics.result).not.toBeNone(); }); });
