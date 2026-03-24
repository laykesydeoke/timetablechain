import { initSimnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { ClarityType } from "@stacks/transactions";

export async function createSimnet() {
  return await initSimnet();
}

const simnet = await createSimnet();
export { simnet };

// Deep equality helper for Clarity values (order-insensitive for tuple data keys)
function clarityDeepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== "object" || typeof b !== "object") return a === b;
  // Compare type
  if (a.type !== b.type) return false;
  // For tuples, compare data maps order-insensitively
  if (a.data !== undefined && b.data !== undefined) {
    const aKeys = Object.keys(a.data).sort();
    const bKeys = Object.keys(b.data).sort();
    if (aKeys.join(",") !== bKeys.join(",")) return false;
    return aKeys.every((k) => clarityDeepEqual(a.data[k], b.data[k]));
  }
  // For lists
  if (Array.isArray(a.list) && Array.isArray(b.list)) {
    if (a.list.length !== b.list.length) return false;
    return a.list.every((v: any, i: number) => clarityDeepEqual(v, b.list[i]));
  }
  // For values (uint, bool, principal, etc.)
  if (a.value !== undefined && b.value !== undefined) {
    return clarityDeepEqual(a.value, b.value);
  }
  // For address principals
  if (a.address !== undefined && b.address !== undefined) {
    return (
      a.address.version === b.address.version &&
      a.address.hash160 === b.address.hash160
    );
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

// Custom Clarity matchers for Vitest
expect.extend({
  toBeOk(received: any, expected?: any) {
    const isOk = received && received.type === ClarityType.ResponseOk;
    if (!isOk) {
      return {
        pass: false,
        message: () =>
          `Expected (ok ...) but received: ${JSON.stringify(received)}`,
      };
    }
    if (expected !== undefined) {
      // Handle asymmetric matchers (e.g. expect.objectContaining, expect.any)
      if (expected && typeof expected.asymmetricMatch === "function") {
        const valueMatches = expected.asymmetricMatch(received.value);
        return {
          pass: valueMatches,
          message: () =>
            `Expected (ok ${JSON.stringify(expected)}) but received (ok ${JSON.stringify(received.value)})`,
        };
      }
      const valueMatches = clarityDeepEqual(received.value, expected);
      return {
        pass: valueMatches,
        message: () =>
          `Expected (ok ${JSON.stringify(expected)}) but received (ok ${JSON.stringify(received.value)})`,
      };
    }
    return {
      pass: true,
      message: () => `Expected not to be (ok ...) but it was`,
    };
  },

  toBeErr(received: any, expected?: any) {
    const isErr = received && received.type === ClarityType.ResponseErr;
    if (!isErr) {
      return {
        pass: false,
        message: () =>
          `Expected (err ...) but received: ${JSON.stringify(received)}`,
      };
    }
    if (expected !== undefined) {
      const valueMatches = clarityDeepEqual(received.value, expected);
      return {
        pass: valueMatches,
        message: () =>
          `Expected (err ${JSON.stringify(expected)}) but received (err ${JSON.stringify(received.value)})`,
      };
    }
    return {
      pass: true,
      message: () => `Expected not to be (err ...) but it was`,
    };
  },

  toBeNone(received: any) {
    const isNone = received && received.type === ClarityType.OptionalNone;
    return {
      pass: isNone,
      message: () =>
        isNone
          ? `Expected not to be none but it was none`
          : `Expected none but received: ${JSON.stringify(received)}`,
    };
  },

  toBeSome(received: any, expected?: any) {
    const isSome = received && received.type === ClarityType.OptionalSome;
    if (!isSome) {
      return {
        pass: false,
        message: () =>
          `Expected (some ...) but received: ${JSON.stringify(received)}`,
      };
    }
    if (expected !== undefined) {
      const valueMatches = clarityDeepEqual(received.value, expected);
      return {
        pass: valueMatches,
        message: () =>
          `Expected (some ${JSON.stringify(expected)}) but received (some ${JSON.stringify(received.value)})`,
      };
    }
    return {
      pass: true,
      message: () => `Expected not to be (some ...) but it was`,
    };
  },
});
