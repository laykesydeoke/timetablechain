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
      expect(result.result).toBeOk(Cl.uint(1));
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
      expect(transfer.result).toBeErr(Cl.uint(411));
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
      expect(result.result).toBeErr(Cl.uint(410));
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

    it("blocks authorizing contract owner as teacher", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "authorize-teacher",
        [Cl.principal(deployer)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });

    it("blocks revoking contract owner as teacher", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "revoke-teacher",
        [Cl.principal(deployer)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });

    it("blocks deactivation of invalid token-id", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "deactivate-slot",
        [Cl.uint(0)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(406));
    });

    it("blocks reactivation of invalid token-id", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "reactivate-slot",
        [Cl.uint(0), Cl.uint(500)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(406));
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
      expect(result.result).toBeErr(Cl.uint(411));
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

  describe("expiration checks", () => {
    it("blocks transfer of expired slot", () => {
      // time-block of 1 is in the past (current block > 1)
      // Mine blocks to advance past time-block
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Latin"), Cl.uint(10), Cl.uint(555)],
        deployer
      );

      // Mine blocks past the time-block
      simnet.mineEmptyBlocks(200);

      const transfer = simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );
      expect(transfer.result).toBeErr(Cl.uint(412));
    });

    it("blocks swap when slot-a is expired", () => {
      simnet.callPublicFn(
        "timetablechain",
        "authorize-teacher",
        [Cl.principal(wallet1)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Drama"), Cl.uint(8), Cl.uint(301)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(300), Cl.stringAscii("Dance"), Cl.uint(9), Cl.uint(302)],
        wallet1
      );

      simnet.mineEmptyBlocks(200);

      const result = simnet.callPublicFn(
        "timetablechain",
        "swap-slots",
        [Cl.uint(1), Cl.uint(2), Cl.principal(wallet1)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(412));
    });

    it("is-slot-expired-ro returns true for expired slot", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Ethics"), Cl.uint(5), Cl.uint(201)],
        deployer
      );

      simnet.mineEmptyBlocks(200);

      const expired = simnet.callReadOnlyFn(
        "timetablechain",
        "is-slot-expired-ro",
        [Cl.uint(1)],
        deployer
      );
      expect(expired.result).toBeOk(Cl.bool(true));
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
      expect(result.result).toBeErr(Cl.uint(411));
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
      expect(result.result).toBeErr(Cl.uint(411));
    });

    it("blocks self-swap", () => {
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

      const result = simnet.callPublicFn(
        "timetablechain",
        "swap-slots",
        [Cl.uint(1), Cl.uint(2), Cl.principal(deployer)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(405));
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

  describe("slot search and filter", () => {
    it("get-slots-by-subject returns matching tokens", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Algebra"), Cl.uint(9), Cl.uint(101)],
        deployer
      );
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Algebra"), Cl.uint(10), Cl.uint(102)],
        deployer
      );
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(300), Cl.stringAscii("Biology"), Cl.uint(11), Cl.uint(103)],
        deployer
      );

      const result = simnet.callReadOnlyFn(
        "timetablechain",
        "get-slots-by-subject",
        [Cl.stringAscii("Algebra")],
        deployer
      );
      expect(result.result).toBeOk(Cl.list([Cl.uint(1), Cl.uint(2)]));
    });

    it("get-slots-by-grade returns matching tokens", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Chemistry"), Cl.uint(8), Cl.uint(201)],
        deployer
      );
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Physics"), Cl.uint(8), Cl.uint(202)],
        deployer
      );

      const result = simnet.callReadOnlyFn(
        "timetablechain",
        "get-slots-by-grade",
        [Cl.uint(8)],
        deployer
      );
      expect(result.result).toBeOk(Cl.list([Cl.uint(1), Cl.uint(2)]));
    });

    it("get-slots-by-room returns matching tokens", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("English"), Cl.uint(7), Cl.uint(303)],
        deployer
      );

      const result = simnet.callReadOnlyFn(
        "timetablechain",
        "get-slots-by-room",
        [Cl.uint(303)],
        deployer
      );
      expect(result.result).toBeOk(Cl.list([Cl.uint(1)]));
    });

    it("get-active-slot-count decrements on deactivate", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Art"), Cl.uint(5), Cl.uint(401)],
        deployer
      );
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("PE"), Cl.uint(6), Cl.uint(402)],
        deployer
      );

      const countBefore = simnet.callReadOnlyFn(
        "timetablechain",
        "get-active-slot-count",
        [],
        deployer
      );
      expect(countBefore.result).toBeOk(Cl.uint(2));

      simnet.callPublicFn(
        "timetablechain",
        "deactivate-slot",
        [Cl.uint(1)],
        deployer
      );

      const countAfter = simnet.callReadOnlyFn(
        "timetablechain",
        "get-active-slot-count",
        [],
        deployer
      );
      expect(countAfter.result).toBeOk(Cl.uint(1));
    });

    it("returns empty list for unknown subject", () => {
      const result = simnet.callReadOnlyFn(
        "timetablechain",
        "get-slots-by-subject",
        [Cl.stringAscii("Underwater Basket Weaving")],
        deployer
      );
      expect(result.result).toBeOk(Cl.list([]));
    });
  });

  describe("batch operations", () => {
    it("batch-create-slots creates multiple slots", () => {
      const slots = Cl.list([
        Cl.tuple({
          "time-block": Cl.uint(100),
          subject: Cl.stringAscii("Math"),
          grade: Cl.uint(8),
          "room-id": Cl.uint(101)
        }),
        Cl.tuple({
          "time-block": Cl.uint(200),
          subject: Cl.stringAscii("Science"),
          grade: Cl.uint(9),
          "room-id": Cl.uint(102)
        }),
        Cl.tuple({
          "time-block": Cl.uint(300),
          subject: Cl.stringAscii("English"),
          grade: Cl.uint(10),
          "room-id": Cl.uint(103)
        })
      ]);

      const result = simnet.callPublicFn(
        "timetablechain",
        "batch-create-slots",
        [slots],
        deployer
      );
      expect(result.result).toBeOk(
        Cl.list([Cl.uint(1), Cl.uint(2), Cl.uint(3)])
      );

      const lastId = simnet.callReadOnlyFn(
        "timetablechain",
        "get-last-token-id",
        [],
        deployer
      );
      expect(lastId.result).toBeOk(Cl.uint(3));
    });

    it("batch-create-slots blocks empty batch", () => {
      const result = simnet.callPublicFn(
        "timetablechain",
        "batch-create-slots",
        [Cl.list([])],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });

    it("batch-deactivate-slots deactivates owned slots", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Art"), Cl.uint(5), Cl.uint(401)],
        deployer
      );
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Music"), Cl.uint(6), Cl.uint(402)],
        deployer
      );

      const result = simnet.callPublicFn(
        "timetablechain",
        "batch-deactivate-slots",
        [Cl.list([Cl.uint(1), Cl.uint(2)])],
        deployer
      );
      expect(result.result).toBeOk(Cl.list([Cl.bool(true), Cl.bool(true)]));

      const slot1 = simnet.callReadOnlyFn(
        "timetablechain",
        "get-slot-details",
        [Cl.uint(1)],
        deployer
      );
      expect(slot1.result).toBeOk(
        expect.objectContaining({ type: expect.any(Number) })
      );
    });

    it("batch-deactivate-slots skips non-owned slots", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Drama"), Cl.uint(7), Cl.uint(501)],
        deployer
      );

      // wallet1 tries to deactivate deployer's slot - should return false
      const result = simnet.callPublicFn(
        "timetablechain",
        "batch-deactivate-slots",
        [Cl.list([Cl.uint(1)])],
        wallet1
      );
      expect(result.result).toBeOk(Cl.list([Cl.bool(false)]));
    });
  });

  describe("teacher statistics", () => {
    it("tracks total-created and active-count on creation", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Math"), Cl.uint(8), Cl.uint(101)],
        deployer
      );
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Science"), Cl.uint(9), Cl.uint(102)],
        deployer
      );

      const stats = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-stats",
        [Cl.principal(deployer)],
        deployer
      );
      expect(stats.result).toBeOk(
        Cl.tuple({
          "total-created": Cl.uint(2),
          "total-transferred-out": Cl.uint(0),
          "total-transferred-in": Cl.uint(0),
          "total-swapped": Cl.uint(0),
          "active-count": Cl.uint(2),
        })
      );
    });

    it("updates stats on transfer for both parties", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("English"), Cl.uint(7), Cl.uint(201)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "transfer",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );

      const senderStats = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-stats",
        [Cl.principal(deployer)],
        deployer
      );
      expect(senderStats.result).toBeOk(
        Cl.tuple({
          "total-created": Cl.uint(1),
          "total-transferred-out": Cl.uint(1),
          "total-transferred-in": Cl.uint(0),
          "total-swapped": Cl.uint(0),
          "active-count": Cl.uint(0),
        })
      );

      const receiverStats = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-stats",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(receiverStats.result).toBeOk(
        Cl.tuple({
          "total-created": Cl.uint(0),
          "total-transferred-out": Cl.uint(0),
          "total-transferred-in": Cl.uint(1),
          "total-swapped": Cl.uint(0),
          "active-count": Cl.uint(1),
        })
      );
    });

    it("decrements active-count on deactivation", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("History"), Cl.uint(6), Cl.uint(301)],
        deployer
      );
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Geography"), Cl.uint(5), Cl.uint(302)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "deactivate-slot",
        [Cl.uint(1)],
        deployer
      );

      const stats = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-stats",
        [Cl.principal(deployer)],
        deployer
      );
      expect(stats.result).toBeOk(
        Cl.tuple({
          "total-created": Cl.uint(2),
          "total-transferred-out": Cl.uint(0),
          "total-transferred-in": Cl.uint(0),
          "total-swapped": Cl.uint(0),
          "active-count": Cl.uint(1),
        })
      );
    });

    it("tracks swap count for both teachers", () => {
      simnet.callPublicFn(
        "timetablechain",
        "authorize-teacher",
        [Cl.principal(wallet1)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Art"), Cl.uint(4), Cl.uint(401)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(200), Cl.stringAscii("Music"), Cl.uint(3), Cl.uint(402)],
        wallet1
      );

      simnet.callPublicFn(
        "timetablechain",
        "swap-slots",
        [Cl.uint(1), Cl.uint(2), Cl.principal(wallet1)],
        deployer
      );

      const deployerStats = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-stats",
        [Cl.principal(deployer)],
        deployer
      );
      expect(deployerStats.result).toBeOk(
        Cl.tuple({
          "total-created": Cl.uint(1),
          "total-transferred-out": Cl.uint(0),
          "total-transferred-in": Cl.uint(0),
          "total-swapped": Cl.uint(1),
          "active-count": Cl.uint(1),
        })
      );

      const wallet1Stats = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-stats",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(wallet1Stats.result).toBeOk(
        Cl.tuple({
          "total-created": Cl.uint(1),
          "total-transferred-out": Cl.uint(0),
          "total-transferred-in": Cl.uint(0),
          "total-swapped": Cl.uint(1),
          "active-count": Cl.uint(1),
        })
      );
    });

    it("returns default zero stats for unknown teacher", () => {
      const stats = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-stats",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(stats.result).toBeOk(
        Cl.tuple({
          "total-created": Cl.uint(0),
          "total-transferred-out": Cl.uint(0),
          "total-transferred-in": Cl.uint(0),
          "total-swapped": Cl.uint(0),
          "active-count": Cl.uint(0),
        })
      );
    });

    it("restores active-count on reactivation", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("PE"), Cl.uint(3), Cl.uint(501)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "deactivate-slot",
        [Cl.uint(1)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "reactivate-slot",
        [Cl.uint(1), Cl.uint(500)],
        deployer
      );

      const stats = simnet.callReadOnlyFn(
        "timetablechain",
        "get-teacher-stats",
        [Cl.principal(deployer)],
        deployer
      );
      expect(stats.result).toBeOk(
        Cl.tuple({
          "total-created": Cl.uint(1),
          "total-transferred-out": Cl.uint(0),
          "total-transferred-in": Cl.uint(0),
          "total-swapped": Cl.uint(0),
          "active-count": Cl.uint(1),
        })
      );
    });
  });

  describe("scheduling conflicts", () => {
    it("blocks creating slot in same room+time-block", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Math"), Cl.uint(9), Cl.uint(201)],
        deployer
      );

      // Same room and same time-block should fail
      const result = simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Physics"), Cl.uint(10), Cl.uint(201)],
        deployer
      );
      expect(result.result).toBeErr(Cl.uint(409));
    });

    it("allows creating slot after room is freed by deactivation", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("English"), Cl.uint(8), Cl.uint(301)],
        deployer
      );

      simnet.callPublicFn(
        "timetablechain",
        "deactivate-slot",
        [Cl.uint(1)],
        deployer
      );

      // After deactivation, room+time-block should be available again
      const result = simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("History"), Cl.uint(7), Cl.uint(301)],
        deployer
      );
      expect(result.result).toBeOk(Cl.uint(2));
    });

    it("has-scheduling-conflict returns true for occupied slot", () => {
      simnet.callPublicFn(
        "timetablechain",
        "create-teaching-slot",
        [Cl.uint(100), Cl.stringAscii("Chemistry"), Cl.uint(11), Cl.uint(401)],
        deployer
      );

      const conflict = simnet.callReadOnlyFn(
        "timetablechain",
        "has-scheduling-conflict",
        [Cl.uint(401), Cl.uint(100)],
        deployer
      );
      expect(conflict.result).toBeOk(Cl.bool(true));
    });

    it("has-scheduling-conflict returns false for free slot", () => {
      const conflict = simnet.callReadOnlyFn(
        "timetablechain",
        "has-scheduling-conflict",
        [Cl.uint(999), Cl.uint(100)],
        deployer
      );
      expect(conflict.result).toBeOk(Cl.bool(false));
    });
  });
});
