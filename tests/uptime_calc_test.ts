import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('uptime calc', () => {
  it('uptime calculation works', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-protocol-uptime', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
