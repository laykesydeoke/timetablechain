import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('pause analytics', () => {
  it('pause state and analytics coexist', () => {
    const pause = simnet.callReadOnlyFn('timetablechain', 'get-pause-state', [], simnet.deployer);
    const analytics = simnet.callReadOnlyFn('timetablechain', 'get-slot-analytics', [], simnet.deployer);
    expect(pause.result).not.toBeNone();
    expect(analytics.result).not.toBeNone(); }); });
