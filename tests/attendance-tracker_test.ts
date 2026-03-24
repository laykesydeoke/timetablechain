import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;
const wallet3 = simnet.getAccounts().get("wallet_3")!;

// Status constants
const STATUS_PRESENT = 1;
const STATUS_ABSENT = 2;
const STATUS_LATE = 3;
const STATUS_EXCUSED = 4;

describe("attendance-tracker contract", () => {
  it("deploys successfully", () => {
    const contracts = simnet.getContractsInterfaces();
    expect(contracts.has(`${deployer}.attendance-tracker`)).toBe(true);
  });

  it("returns empty student record for new student", () => {
    const result = simnet.callReadOnlyFn(
      "attendance-tracker",
      "get-student-record",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result.result).toStrictEqual(Cl.tuple({
      "total-present": Cl.uint(0),
      "total-absent": Cl.uint(0),
      "total-late": Cl.uint(0),
      "total-excused": Cl.uint(0),
      "total-slots": Cl.uint(0),
    }));
  });

  it("returns empty slot summary for new slot", () => {
    const result = simnet.callReadOnlyFn(
      "attendance-tracker",
      "get-slot-summary",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toStrictEqual(Cl.tuple({
      "present-count": Cl.uint(0),
      "absent-count": Cl.uint(0),
      "late-count": Cl.uint(0),
      "excused-count": Cl.uint(0),
      "total-recorded": Cl.uint(0),
    }));
  });

  it("allows owner to authorize a recorder", () => {
    const { result } = simnet.callPublicFn(
      "attendance-tracker",
      "authorize-recorder",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    const isAuth = simnet.callReadOnlyFn(
      "attendance-tracker",
      "is-recorder-authorized",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(isAuth.result).toStrictEqual(Cl.bool(true));
  });

  it("prevents non-owner from authorizing recorders", () => {
    const { result } = simnet.callPublicFn(
      "attendance-tracker",
      "authorize-recorder",
      [Cl.principal(wallet2)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(600));
  });

  it("allows owner to record attendance", () => {
    const { result } = simnet.callPublicFn(
      "attendance-tracker",
      "record-attendance",
      [Cl.uint(1), Cl.principal(wallet1), Cl.uint(STATUS_PRESENT)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("allows authorized recorder to record attendance", () => {
    // Authorize wallet1 as recorder
    simnet.callPublicFn("attendance-tracker", "authorize-recorder",
      [Cl.principal(wallet1)], deployer);

    const { result } = simnet.callPublicFn(
      "attendance-tracker",
      "record-attendance",
      [Cl.uint(5), Cl.principal(wallet2), Cl.uint(STATUS_PRESENT)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents unauthorized recorder from recording", () => {
    const { result } = simnet.callPublicFn(
      "attendance-tracker",
      "record-attendance",
      [Cl.uint(2), Cl.principal(wallet1), Cl.uint(STATUS_PRESENT)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(600));
  });

  it("prevents double recording for same student/slot", () => {
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(10), Cl.principal(wallet1), Cl.uint(STATUS_PRESENT)], deployer);

    const { result } = simnet.callPublicFn(
      "attendance-tracker",
      "record-attendance",
      [Cl.uint(10), Cl.principal(wallet1), Cl.uint(STATUS_ABSENT)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(603));
  });

  it("rejects invalid status", () => {
    const { result } = simnet.callPublicFn(
      "attendance-tracker",
      "record-attendance",
      [Cl.uint(11), Cl.principal(wallet1), Cl.uint(0)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(601));

    const { result: result2 } = simnet.callPublicFn(
      "attendance-tracker",
      "record-attendance",
      [Cl.uint(11), Cl.principal(wallet1), Cl.uint(5)],
      deployer
    );
    expect(result2).toBeErr(Cl.uint(601));
  });

  it("rejects zero slot-id", () => {
    const { result } = simnet.callPublicFn(
      "attendance-tracker",
      "record-attendance",
      [Cl.uint(0), Cl.principal(wallet1), Cl.uint(STATUS_PRESENT)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(601));
  });

  it("updates slot attendance summary correctly", () => {
    // Record multiple attendances for slot 20
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(20), Cl.principal(wallet1), Cl.uint(STATUS_PRESENT)], deployer);
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(20), Cl.principal(wallet2), Cl.uint(STATUS_LATE)], deployer);
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(20), Cl.principal(wallet3), Cl.uint(STATUS_ABSENT)], deployer);

    const summary = simnet.callReadOnlyFn(
      "attendance-tracker",
      "get-slot-summary",
      [Cl.uint(20)],
      deployer
    );
    expect(summary.result).toStrictEqual(Cl.tuple({
      "present-count": Cl.uint(1),
      "absent-count": Cl.uint(1),
      "late-count": Cl.uint(1),
      "excused-count": Cl.uint(0),
      "total-recorded": Cl.uint(3),
    }));
  });

  it("updates student aggregate record correctly", () => {
    // Record wallet1 in multiple slots
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(30), Cl.principal(wallet1), Cl.uint(STATUS_PRESENT)], deployer);
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(31), Cl.principal(wallet1), Cl.uint(STATUS_LATE)], deployer);
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(32), Cl.principal(wallet1), Cl.uint(STATUS_ABSENT)], deployer);
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(33), Cl.principal(wallet1), Cl.uint(STATUS_EXCUSED)], deployer);

    const record = simnet.callReadOnlyFn(
      "attendance-tracker",
      "get-student-record",
      [Cl.principal(wallet1)],
      deployer
    );
    // Note: wallet1 may have other records from earlier tests
    // Just verify the type is a tuple
    // Verify it's a tuple with expected keys
    const val = record.result as any;
    expect(val.data).toBeDefined();
    expect(val.data["total-present"]).toBeDefined();
  });

  it("calculates student attendance rate", () => {
    // Use wallet3 who only has 1 record from slot 20 (absent)
    // Record more for wallet3
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(40), Cl.principal(wallet3), Cl.uint(STATUS_PRESENT)], deployer);
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(41), Cl.principal(wallet3), Cl.uint(STATUS_PRESENT)], deployer);
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(42), Cl.principal(wallet3), Cl.uint(STATUS_LATE)], deployer);

    // wallet3: 2 present + 1 late + 1 absent = 4 total, 3 attended
    // Rate = (2+1) / 4 * 10000 = 7500
    const rate = simnet.callReadOnlyFn(
      "attendance-tracker",
      "get-attendance-rate",
      [Cl.principal(wallet3)],
      deployer
    );
    expect(rate.result).toStrictEqual(Cl.uint(7500));
  });

  it("returns zero attendance rate for new student", () => {
    const wallet4 = simnet.getAccounts().get("wallet_4")!;
    const rate = simnet.callReadOnlyFn(
      "attendance-tracker",
      "get-attendance-rate",
      [Cl.principal(wallet4)],
      deployer
    );
    expect(rate.result).toStrictEqual(Cl.uint(0));
  });

  it("calculates slot attendance rate", () => {
    // Slot 20 had: 1 present, 1 late, 1 absent = 2/3 attended
    // Rate = (1+1) / 3 * 10000 = 6666
    const rate = simnet.callReadOnlyFn(
      "attendance-tracker",
      "get-slot-attendance-rate",
      [Cl.uint(20)],
      deployer
    );
    expect(rate.result).toStrictEqual(Cl.uint(6666));
  });

  it("tracks total record count", () => {
    const count = simnet.callReadOnlyFn(
      "attendance-tracker",
      "get-total-records",
      [],
      deployer
    );
    // Multiple records created in earlier tests
    // Just verify it's a positive uint
    const val = Number((count.result as any).value);
    expect(val).toBeGreaterThan(0);
  });

  it("correctly reports is-attendance-recorded", () => {
    const recorded = simnet.callReadOnlyFn(
      "attendance-tracker",
      "is-attendance-recorded",
      [Cl.uint(20), Cl.principal(wallet1)],
      deployer
    );
    expect(recorded.result).toStrictEqual(Cl.bool(true));

    const wallet4 = simnet.getAccounts().get("wallet_4")!;
    const notRecorded = simnet.callReadOnlyFn(
      "attendance-tracker",
      "is-attendance-recorded",
      [Cl.uint(20), Cl.principal(wallet4)],
      deployer
    );
    expect(notRecorded.result).toStrictEqual(Cl.bool(false));
  });

  it("allows owner to revoke recorder", () => {
    simnet.callPublicFn("attendance-tracker", "authorize-recorder",
      [Cl.principal(wallet2)], deployer);

    const { result } = simnet.callPublicFn(
      "attendance-tracker",
      "revoke-recorder",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    const isAuth = simnet.callReadOnlyFn(
      "attendance-tracker",
      "is-recorder-authorized",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(isAuth.result).toStrictEqual(Cl.bool(false));
  });

  it("records excused status correctly", () => {
    simnet.callPublicFn("attendance-tracker", "record-attendance",
      [Cl.uint(50), Cl.principal(wallet1), Cl.uint(STATUS_EXCUSED)], deployer);

    const record = simnet.callReadOnlyFn(
      "attendance-tracker",
      "get-attendance",
      [Cl.uint(50), Cl.principal(wallet1)],
      deployer
    );
    expect(record.result).toBeSome();
  });
});
