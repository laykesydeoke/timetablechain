import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("timetablechain", () => {
    it("creates a teaching slot", () => {
        const result = simnet.callPublicFn(
            "timetablechain",
            "create-teaching-slot",
            [Cl.uint(100), Cl.stringAscii("Mathematics"), Cl.uint(10), Cl.uint(101)],
            deployer
        );
        expect(result.result).toBeOk(Cl.uint(1));
    });

    it("retrieves slot details", () => {
        simnet.callPublicFn(
            "timetablechain",
            "create-teaching-slot",
            [Cl.uint(100), Cl.stringAscii("Physics"), Cl.uint(11), Cl.uint(205)],
            deployer
        );

        const details = simnet.callReadOnlyFn(
            "timetablechain",
            "get-slot-details",
            [Cl.uint(1)],
            deployer
        );
        expect(details.result).toBeOk(expect.objectContaining({}));
    });

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

    it("toggles contract pause", () => {
        const result = simnet.callPublicFn(
            "timetablechain",
            "toggle-pause",
            [],
            deployer
        );
        expect(result.result).toBeOk(Cl.bool(true));
    });
});
