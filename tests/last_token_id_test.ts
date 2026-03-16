import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe('last token id', () => {
  it('last token id readable', () => {
    const r = simnet.callReadOnlyFn('timetablechain', 'get-last-token-id', [], simnet.deployer);
    expect(r.result).not.toBeNone(); }); });
