import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
import { createSimnet } from "./setup";

let simnet: Awaited<ReturnType<typeof createSimnet>>;
let deployer: string;
let wallet1: string;
let wallet2: string;

beforeEach(async () => {
  simnet = await createSimnet();
  deployer = simnet.deployer;
  wallet1 = simnet.getAccounts().get("wallet_1")!;
  wallet2 = simnet.getAccounts().get("wallet_2")!;
});

// Helper: create a slot owned by deployer and return its token ID
function createDeployerSlot(timeBlock: number, room: number): number {
  const result = simnet.callPublicFn(
    "timetablechain",
    "create-teaching-slot",
    [Cl.uint(timeBlock), Cl.stringAscii("Math"), Cl.uint(8), Cl.uint(room)],
    deployer
  );
  // Return the token ID from the ok result
  const res = result.result as any;
  return Number((res.value as any).value);
}

describe("slot-marketplace", () => {
  describe("list-slot", () => {
    it("allows slot owner to list a slot", () => {
      const tokenId = createDeployerSlot(200, 101);

      const result = simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("rejects listing with zero price", () => {
      const tokenId = createDeployerSlot(200, 101);

      const result = simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });

    it("rejects listing by non-owner", () => {
      const tokenId = createDeployerSlot(200, 101);

      const result = simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });

    it("rejects double-listing of same token", () => {
      const tokenId = createDeployerSlot(200, 101);

      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );

      const result = simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(2000000)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(409));
    });

    it("rejects listing of token-id zero", () => {
      const result = simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(0), Cl.uint(1000000)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });
  });

  describe("cancel-listing", () => {
    it("allows seller to cancel their listing", () => {
      const tokenId = createDeployerSlot(200, 101);
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );

      const result = simnet.callPublicFn(
        "slot-marketplace",
        "cancel-listing",
        [Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("blocks non-seller from cancelling", () => {
      const tokenId = createDeployerSlot(200, 101);
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );

      const result = simnet.callPublicFn(
        "slot-marketplace",
        "cancel-listing",
        [Cl.uint(1)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });

    it("blocks cancelling an already cancelled listing", () => {
      const tokenId = createDeployerSlot(200, 101);
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );
      simnet.callPublicFn(
        "slot-marketplace",
        "cancel-listing",
        [Cl.uint(1)],
        deployer
      );

      const result = simnet.callPublicFn(
        "slot-marketplace",
        "cancel-listing",
        [Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(406));
    });

    it("blocks cancel with invalid listing-id", () => {
      const result = simnet.callPublicFn(
        "slot-marketplace",
        "cancel-listing",
        [Cl.uint(999)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(407));
    });

    it("allows re-listing after cancellation", () => {
      const tokenId = createDeployerSlot(200, 101);
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );
      simnet.callPublicFn(
        "slot-marketplace",
        "cancel-listing",
        [Cl.uint(1)],
        deployer
      );

      // Should be able to re-list after cancellation
      const result = simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(500000)],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(2));
    });
  });

  describe("update-price", () => {
    it("allows seller to update listing price", () => {
      const tokenId = createDeployerSlot(200, 101);
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );

      const result = simnet.callPublicFn(
        "slot-marketplace",
        "update-price",
        [Cl.uint(1), Cl.uint(2000000)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("blocks non-seller from updating price", () => {
      const tokenId = createDeployerSlot(200, 101);
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );

      const result = simnet.callPublicFn(
        "slot-marketplace",
        "update-price",
        [Cl.uint(1), Cl.uint(2000000)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });

    it("rejects update to zero price", () => {
      const tokenId = createDeployerSlot(200, 101);
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );

      const result = simnet.callPublicFn(
        "slot-marketplace",
        "update-price",
        [Cl.uint(1), Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });

    it("blocks update on invalid listing-id", () => {
      const result = simnet.callPublicFn(
        "slot-marketplace",
        "update-price",
        [Cl.uint(0), Cl.uint(1000000)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(407));
    });
  });

  describe("set-marketplace-fee", () => {
    it("allows owner to set fee", () => {
      const result = simnet.callPublicFn(
        "slot-marketplace",
        "set-marketplace-fee",
        [Cl.uint(500)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));

      // Verify fee was updated
      const fee = simnet.callReadOnlyFn(
        "slot-marketplace",
        "get-marketplace-fee",
        [],
        deployer
      );
      expect(fee.result).toBeOk(Cl.uint(500));
    });

    it("blocks non-owner from setting fee", () => {
      const result = simnet.callPublicFn(
        "slot-marketplace",
        "set-marketplace-fee",
        [Cl.uint(100)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });

    it("blocks setting fee above 1000 basis points", () => {
      const result = simnet.callPublicFn(
        "slot-marketplace",
        "set-marketplace-fee",
        [Cl.uint(1001)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });

    it("allows setting fee to zero", () => {
      const result = simnet.callPublicFn(
        "slot-marketplace",
        "set-marketplace-fee",
        [Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));

      // Verify fee is now zero
      const fee = simnet.callReadOnlyFn(
        "slot-marketplace",
        "get-marketplace-fee",
        [],
        deployer
      );
      expect(fee.result).toBeOk(Cl.uint(0));
    });
  });

  describe("read-only queries", () => {
    it("get-listing returns listing data", () => {
      const tokenId = createDeployerSlot(200, 101);
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );

      const listing = simnet.callReadOnlyFn(
        "slot-marketplace",
        "get-listing",
        [Cl.uint(1)],
        deployer
      );
      expect(listing.result).not.toBeNone();
    });

    it("get-listing returns none for nonexistent id", () => {
      const listing = simnet.callReadOnlyFn(
        "slot-marketplace",
        "get-listing",
        [Cl.uint(999)],
        deployer
      );
      expect(listing.result).toBeNone();
    });

    it("get-listing-count returns total listing count", () => {
      const tokenId1 = createDeployerSlot(200, 101);
      const tokenId2 = createDeployerSlot(300, 102);

      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId1), Cl.uint(1000000)],
        deployer
      );
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId2), Cl.uint(2000000)],
        deployer
      );

      const count = simnet.callReadOnlyFn(
        "slot-marketplace",
        "get-listing-count",
        [],
        deployer
      );
      expect(count.result).toBeOk(Cl.uint(2));
    });

    it("get-marketplace-fee returns current fee", () => {
      const fee = simnet.callReadOnlyFn(
        "slot-marketplace",
        "get-marketplace-fee",
        [],
        deployer
      );
      expect(fee.result).toBeOk(Cl.uint(250));
    });

    it("get-listing-for-token returns listing-id for listed token", () => {
      const tokenId = createDeployerSlot(200, 101);
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );

      const result = simnet.callReadOnlyFn(
        "slot-marketplace",
        "get-listing-for-token",
        [Cl.uint(tokenId)],
        deployer
      );
      expect(result.result).not.toBeNone();
    });

    it("is-listing-valid returns true for active non-expired listing", () => {
      const tokenId = createDeployerSlot(200, 101);
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );

      const valid = simnet.callReadOnlyFn(
        "slot-marketplace",
        "is-listing-valid",
        [Cl.uint(1)],
        deployer
      );
      expect(valid.result).toBeOk(Cl.bool(true));
    });

    it("is-listing-valid returns false after cancel", () => {
      const tokenId = createDeployerSlot(200, 101);
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );
      simnet.callPublicFn(
        "slot-marketplace",
        "cancel-listing",
        [Cl.uint(1)],
        deployer
      );

      const valid = simnet.callReadOnlyFn(
        "slot-marketplace",
        "is-listing-valid",
        [Cl.uint(1)],
        deployer
      );
      expect(valid.result).toBeOk(Cl.bool(false));
    });

    it("get-price-breakdown returns correct fee calculation", () => {
      const tokenId = createDeployerSlot(200, 101);
      // Price 1000000, fee 2.5% = 25000, seller gets 975000
      simnet.callPublicFn(
        "slot-marketplace",
        "list-slot",
        [Cl.uint(tokenId), Cl.uint(1000000)],
        deployer
      );

      const breakdown = simnet.callReadOnlyFn(
        "slot-marketplace",
        "get-price-breakdown",
        [Cl.uint(1)],
        deployer
      );
      expect(breakdown.result).toBeOk(
        Cl.tuple({
          price: Cl.uint(1000000),
          "fee-amount": Cl.uint(25000),
          "seller-receives": Cl.uint(975000),
          "fee-rate": Cl.uint(250),
        })
      );
    });
  });
});
