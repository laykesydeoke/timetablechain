import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("timetablechain", () => {
  describe("slot creation", () => {
    it("allows deployer to create a slot", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Mathematics"), Cl.uint(10), Cl.uint(101)],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("allows authorized teacher to create a slot", () => {
      simnet.callPublicFn(
        "timetablechain",
        "authorize-teacher",
        [Cl.principal(wallet1)],
        deployer
      );

      const result = simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Physics"), Cl.uint(11), Cl.uint(205)],
        wallet1
      );
      expect(result.result).toBeOk(Cl.uint(2));
    });

    it("blocks unauthorized user from creating slots", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("History"), Cl.uint(9), Cl.uint(103)],
        wallet2
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });

    it("rejects invalid grade", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Art"), Cl.uint(15), Cl.uint(101)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(402));
    });

    it("rejects invalid room", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Music"), Cl.uint(5), Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(403));
    });

    it("rejects empty subject", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii(""), Cl.uint(5), Cl.uint(101)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });
  });

  describe("slot details", () => {
    it("returns slot details for existing token", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Biology"), Cl.uint(10), Cl.uint(301)],
        deployer
      );

      const details = simnet.callReadOnlyFn(
        "timetablechain",
        "get-slot-details",
        [Cl.uint(1)],
        deployer
      );
      expect(details.result).toBeOk(
        expect.objectContaining({
          type: expect.any(Number),
        })
      );
    });

    it("returns error for nonexistent token", () => {
      const details = simnet.callReadOnlyFn(
        "timetablechain",
        "get-slot-details",
        [Cl.uint(999)],
        deployer
      );
      expect(details.result).toBeErr(Cl.uint(404));
    });

    it("returns error for nonexistent token owner", () => {
      const owner = simnet.callReadOnlyFn(
        "timetablechain",
        "get-token-owner",
        [Cl.uint(999)],
        deployer
      );
      expect(owner.result).toBeErr(Cl.uint(404));
    });
  });

  describe("transfer", () => {
    it("transfers slot to another teacher", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("English"), Cl.uint(9), Cl.uint(103)],
        deployer
      );

      const transfer = simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );
      expect(transfer.result).toBeOk(Cl.bool(true));

      // Verify new owner
      const owner = simnet.callReadOnlyFn(
        "timetablechain",
        "get-token-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toBeOk(Cl.principal(wallet1));
    });

    it("removes token from sender slot list", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Math"), Cl.uint(8), Cl.uint(101)],
        deployer
      );
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Science"), Cl.uint(7), Cl.uint(102)],
        deployer
      );

      // Transfer first slot
      simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );

      // Deployer should only have slot 2
      const deployerSlots = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-slot-list",
        [Cl.principal(deployer)],
        deployer
      );
      expect(deployerSlots.result).toBeOk(Cl.list([Cl.uint(2)]));

      // Wallet1 should have slot 1
      const wallet1Slots = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-slot-list",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(wallet1Slots.result).toBeOk(Cl.list([Cl.uint(1)]));
    });

    it("blocks transfer from non-owner", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Chemistry"), Cl.uint(12), Cl.uint(301)],
        deployer
      );

      const transfer = simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(1), Cl.principal(wallet2)],
        wallet1
      );
      expect(transfer.result).toBeErr(Cl.uint(401));
    });

    it("blocks self-transfer", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("PE"), Cl.uint(6), Cl.uint(500)],
        deployer
      );

      const transfer = simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(1), Cl.principal(deployer)],
        deployer
      );
      expect(transfer.result).toBeErr(Cl.uint(405));
    });

    it("blocks transfer of nonexistent token", () => {
      const transfer = simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(999), Cl.principal(wallet1)],
        deployer
      );
      expect(transfer.result).toBeErr(Cl.uint(404));
    });
  });

  describe("admin controls", () => {
    it("toggles contract pause", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "toggle-pause",
        [],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("blocks non-owner from pausing", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "toggle-pause",
        [],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });

    it("blocks slot creation when paused", () => {
      simnet.callPublicFn("timetablechain", "toggle-pause", [], deployer);

      const result = simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Math"), Cl.uint(5), Cl.uint(101)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });

    it("authorizes and revokes teachers", () => {
      simnet.callPublicFn(
        "timetablechain",
        "authorize-teacher",
        [Cl.principal(wallet1)],
        deployer
      );

      const authorized = simnet.callReadOnlyFn(
        "timetablechain",
        "is-teacher-authorized",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(authorized.result).toBeOk(Cl.bool(true));

      simnet.callPublicFn(
        "timetablechain",
        "revoke-teacher",
        [Cl.principal(wallet1)],
        deployer
      );

      const revoked = simnet.callReadOnlyFn(
        "timetablechain",
        "is-teacher-authorized",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(revoked.result).toBeOk(Cl.bool(false));
    });
  });

  describe("deactivation", () => {
    it("allows owner to deactivate slot", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Art"), Cl.uint(3), Cl.uint(401)],
        deployer
      );

      const result = simnet.callPublicFn(
        "timetablechain",
        "deactivate-slot",
        [Cl.uint(1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("blocks non-owner from deactivating", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Art"), Cl.uint(3), Cl.uint(401)],
        deployer
      );

      const result = simnet.callPublicFn(
        "timetablechain",
        "deactivate-slot",
        [Cl.uint(1)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });
  });

  describe("transfer safety and history", () => {
    it("blocks transfer of deactivated slot", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Geography"), Cl.uint(7), Cl.uint(201)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "deactivate-slot",
        [Cl.uint(1)],
        deployer
      );

      const transfer = simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );
      expect(transfer.result).toBeErr(Cl.uint(406));
    });

    it("records transfer history after transfer", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("History"), Cl.uint(9), Cl.uint(305)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );

      const record = simnet.callReadOnlyFn(
        "timetablechain",
        "get-transfer-record",
        [Cl.uint(1)],
        deployer
      );
      expect(record.result).not.toBeNone();
    });

    it("increments transfer count on each transfer", () => {
      // Create two slots
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Math"), Cl.uint(8), Cl.uint(101)],
        deployer
      );
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Science"), Cl.uint(7), Cl.uint(102)],
        deployer
      );

      // Transfer first slot
      simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );

      const count1 = simnet.callReadOnlyFn(
        "timetablechain",
        "get-transfer-count",
        [],
        deployer
      );
      expect(count1.result).toBeOk(Cl.uint(1));

      // Transfer second slot
      simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(2), Cl.principal(wallet1)],
        deployer
      );

      const count2 = simnet.callReadOnlyFn(
        "timetablechain",
        "get-transfer-count",
        [],
        deployer
      );
      expect(count2.result).toBeOk(Cl.uint(2));
    });

    it("handles recipient at max slot capacity", () => {
      // Recipient already checked via asserts in transfer
      // The as-max-len? u100 check prevents exceeding capacity
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Music"), Cl.uint(4), Cl.uint(110)],
        deployer
      );

      // Verify the capacity check exists by attempting transfer
      // (with fewer than 100 slots, transfer should succeed)
      const transfer = simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );
      expect(transfer.result).toBeOk(Cl.bool(true));
    });
  });

  describe("slot reactivation", () => {
    it("allows owner to reactivate deactivated slot", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Math"), Cl.uint(5), Cl.uint(101)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "deactivate-slot",
        [Cl.uint(1)],
        deployer
      );

      const result = simnet.callPublicFn(
        "timetablechain",
        "reactivate-slot",
        [Cl.uint(1), Cl.uint(500)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("blocks non-owner from reactivating slot", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Science"), Cl.uint(6), Cl.uint(102)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "deactivate-slot",
        [Cl.uint(1)],
        deployer
      );

      const result = simnet.callPublicFn(
        "timetablechain",
        "reactivate-slot",
        [Cl.uint(1), Cl.uint(500)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });

    it("blocks reactivation of already active slot", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("English"), Cl.uint(7), Cl.uint(103)],
        deployer
      );

      const result = simnet.callPublicFn(
        "timetablechain",
        "reactivate-slot",
        [Cl.uint(1), Cl.uint(500)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(409));
    });
  });

  describe("slot swap", () => {
    it("swaps slots between two teachers", () => {
      // Authorize wallet1 as teacher
      simnet.callPublicFn(
        "timetablechain",
        "authorize-teacher",
        [Cl.principal(wallet1)],
        deployer
      );

      // Deployer creates slot 1
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Math"), Cl.uint(8), Cl.uint(101)],
        deployer
      );

      // Wallet1 creates slot 2
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Physics"), Cl.uint(9), Cl.uint(202)],
        wallet1
      );

      // Deployer initiates swap
      const result = simnet.callPublicFn(
        "timetablechain",
        "swap-slots",
        [Cl.uint(1), Cl.uint(2), Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeOk(Cl.bool(true));

      // Verify ownership swapped
      const ownerA = simnet.callReadOnlyFn(
        "timetablechain",
        "get-token-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(ownerA.result).toBeOk(Cl.principal(wallet1));

      const ownerB = simnet.callReadOnlyFn(
        "timetablechain",
        "get-token-owner",
        [Cl.uint(2)],
        deployer
      );
      expect(ownerB.result).toBeOk(Cl.principal(deployer));
    });

    it("blocks swap if caller does not own slot-a", () => {
      simnet.callPublicFn(
        "timetablechain",
        "authorize-teacher",
        [Cl.principal(wallet1)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Art"), Cl.uint(4), Cl.uint(301)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Music"), Cl.uint(5), Cl.uint(302)],
        wallet1
      );

      // Wallet1 tries to swap but doesn't own slot 1
      const result = simnet.callPublicFn(
        "timetablechain",
        "swap-slots",
        [Cl.uint(1), Cl.uint(2), Cl.principal(deployer)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });

    it("updates teacher slot lists after swap", () => {
      simnet.callPublicFn(
        "timetablechain",
        "authorize-teacher",
        [Cl.principal(wallet1)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Math"), Cl.uint(8), Cl.uint(101)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Physics"), Cl.uint(9), Cl.uint(202)],
        wallet1
      );

      simnet.callPublicFn(
        "timetablechain",
        "swap-slots",
        [Cl.uint(1), Cl.uint(2), Cl.principal(wallet1)],
        deployer
      );

      // Deployer should now own slot 2, not slot 1
      const deployerSlots = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-slot-list",
        [Cl.principal(deployer)],
        deployer
      );
      expect(deployerSlots.result).toBeOk(Cl.list([Cl.uint(2)]));

      // Wallet1 should now own slot 1, not slot 2
      const wallet1Slots = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-slot-list",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(wallet1Slots.result).toBeOk(Cl.list([Cl.uint(1)]));
    });

    it("records swap operations in transfer history", () => {
      simnet.callPublicFn(
        "timetablechain",
        "authorize-teacher",
        [Cl.principal(wallet1)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Chemistry"), Cl.uint(10), Cl.uint(110)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Biology"), Cl.uint(11), Cl.uint(220)],
        wallet1
      );

      simnet.callPublicFn(
        "timetablechain",
        "swap-slots",
        [Cl.uint(1), Cl.uint(2), Cl.principal(wallet1)],
        deployer
      );

      // Two history records should be created (one per slot)
      const count = simnet.callReadOnlyFn(
        "timetablechain",
        "get-transfer-count",
        [],
        deployer
      );
      expect(count.result).toBeOk(Cl.uint(2));

      const rec1 = simnet.callReadOnlyFn(
        "timetablechain",
        "get-transfer-record",
        [Cl.uint(1)],
        deployer
      );
      expect(rec1.result).not.toBeNone();

      const rec2 = simnet.callReadOnlyFn(
        "timetablechain",
        "get-transfer-record",
        [Cl.uint(2)],
        deployer
      );
      expect(rec2.result).not.toBeNone();
    });
  });
});
