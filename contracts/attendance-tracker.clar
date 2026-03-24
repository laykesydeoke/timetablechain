;; attendance-tracker.clar
;; On-chain attendance tracking for TimetableChain teaching slots
;; Records student attendance per slot, enables attendance reports

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u600))
(define-constant ERR-INVALID-INPUT (err u601))
(define-constant ERR-SLOT-NOT-FOUND (err u602))
(define-constant ERR-ALREADY-RECORDED (err u603))
(define-constant ERR-NOT-ENROLLED (err u604))
(define-constant ERR-SLOT-NOT-ACTIVE (err u605))

;; Attendance status constants
(define-constant STATUS-PRESENT u1)
(define-constant STATUS-ABSENT u2)
(define-constant STATUS-LATE u3)
(define-constant STATUS-EXCUSED u4)

;; Data Variables
(define-data-var record-counter uint u0)

;; Maps

;; Individual attendance records
(define-map attendance-records
    { slot-id: uint, student: principal }
    {
        status: uint,
        recorded-by: principal,
        recorded-at: uint
    }
)

;; Per-slot attendance summary
(define-map slot-attendance
    { slot-id: uint }
    {
        present-count: uint,
        absent-count: uint,
        late-count: uint,
        excused-count: uint,
        total-recorded: uint
    }
)

;; Per-student attendance aggregate (across all slots)
(define-map student-attendance
    { student: principal }
    {
        total-present: uint,
        total-absent: uint,
        total-late: uint,
        total-excused: uint,
        total-slots: uint
    }
)

;; Track authorized recorders (teachers who can mark attendance)
(define-map authorized-recorders
    { recorder: principal }
    { is-authorized: bool }
)

;; ============================================================
;; Admin Functions
;; ============================================================

;; Authorize a teacher to record attendance
(define-public (authorize-recorder (recorder principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        (asserts! (is-standard recorder) ERR-INVALID-INPUT)
        (map-set authorized-recorders
            { recorder: recorder }
            { is-authorized: true })
        (print { event: "recorder-authorized", recorder: recorder })
        (ok true)
    )
)

;; Revoke recorder authorization
(define-public (revoke-recorder (recorder principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        (map-set authorized-recorders
            { recorder: recorder }
            { is-authorized: false })
        (print { event: "recorder-revoked", recorder: recorder })
        (ok true)
    )
)

;; ============================================================
;; Private Helpers
;; ============================================================

(define-private (is-authorized-recorder)
    (or
        (is-eq tx-sender CONTRACT-OWNER)
        (default-to false
            (get is-authorized (map-get? authorized-recorders { recorder: tx-sender })))
    )
)

(define-private (is-valid-status (status uint))
    (or (is-eq status STATUS-PRESENT)
        (or (is-eq status STATUS-ABSENT)
            (or (is-eq status STATUS-LATE)
                (is-eq status STATUS-EXCUSED))))
)

;; ============================================================
;; Public Functions
;; ============================================================

;; Record attendance for a student in a slot
(define-public (record-attendance (slot-id uint) (student principal) (status uint))
    (begin
        (asserts! (is-authorized-recorder) ERR-NOT-AUTHORIZED)
        (asserts! (> slot-id u0) ERR-INVALID-INPUT)
        (asserts! (is-standard student) ERR-INVALID-INPUT)
        (asserts! (is-valid-status status) ERR-INVALID-INPUT)
        ;; Prevent double recording
        (asserts! (is-none (map-get? attendance-records { slot-id: slot-id, student: student }))
                 ERR-ALREADY-RECORDED)

        ;; Store the attendance record
        (map-set attendance-records
            { slot-id: slot-id, student: student }
            { status: status, recorded-by: tx-sender, recorded-at: stacks-block-height }
        )

        ;; Update slot attendance summary
        (let ((current (default-to
                { present-count: u0, absent-count: u0, late-count: u0,
                  excused-count: u0, total-recorded: u0 }
                (map-get? slot-attendance { slot-id: slot-id }))))
            (map-set slot-attendance
                { slot-id: slot-id }
                {
                    present-count: (if (is-eq status STATUS-PRESENT)
                        (+ (get present-count current) u1) (get present-count current)),
                    absent-count: (if (is-eq status STATUS-ABSENT)
                        (+ (get absent-count current) u1) (get absent-count current)),
                    late-count: (if (is-eq status STATUS-LATE)
                        (+ (get late-count current) u1) (get late-count current)),
                    excused-count: (if (is-eq status STATUS-EXCUSED)
                        (+ (get excused-count current) u1) (get excused-count current)),
                    total-recorded: (+ (get total-recorded current) u1)
                }
            )
        )

        ;; Update student aggregate attendance
        (let ((student-agg (default-to
                { total-present: u0, total-absent: u0, total-late: u0,
                  total-excused: u0, total-slots: u0 }
                (map-get? student-attendance { student: student }))))
            (map-set student-attendance
                { student: student }
                {
                    total-present: (if (is-eq status STATUS-PRESENT)
                        (+ (get total-present student-agg) u1) (get total-present student-agg)),
                    total-absent: (if (is-eq status STATUS-ABSENT)
                        (+ (get total-absent student-agg) u1) (get total-absent student-agg)),
                    total-late: (if (is-eq status STATUS-LATE)
                        (+ (get total-late student-agg) u1) (get total-late student-agg)),
                    total-excused: (if (is-eq status STATUS-EXCUSED)
                        (+ (get total-excused student-agg) u1) (get total-excused student-agg)),
                    total-slots: (+ (get total-slots student-agg) u1)
                }
            )
        )

        (var-set record-counter (+ (var-get record-counter) u1))
        (print { event: "attendance-recorded", slot-id: slot-id, student: student,
                 status: status, recorded-by: tx-sender })
        (ok true)
    )
)

;; ============================================================
;; Read-Only Functions
;; ============================================================

;; Get a student's attendance record for a specific slot
(define-read-only (get-attendance (slot-id uint) (student principal))
    (map-get? attendance-records { slot-id: slot-id, student: student })
)

;; Get slot attendance summary
(define-read-only (get-slot-summary (slot-id uint))
    (default-to
        { present-count: u0, absent-count: u0, late-count: u0,
          excused-count: u0, total-recorded: u0 }
        (map-get? slot-attendance { slot-id: slot-id }))
)

;; Get a student's overall attendance record
(define-read-only (get-student-record (student principal))
    (default-to
        { total-present: u0, total-absent: u0, total-late: u0,
          total-excused: u0, total-slots: u0 }
        (map-get? student-attendance { student: student }))
)

;; Calculate a student's attendance rate (percentage * 100 for precision)
;; e.g., 9500 = 95.00%
(define-read-only (get-attendance-rate (student principal))
    (let ((record (get-student-record student)))
        (if (> (get total-slots record) u0)
            (/ (* (+ (get total-present record) (get total-late record)) u10000)
               (get total-slots record))
            u0)
    )
)

;; Get total attendance records
(define-read-only (get-total-records)
    (var-get record-counter)
)

;; Check if a recorder is authorized
(define-read-only (is-recorder-authorized (recorder principal))
    (or
        (is-eq recorder CONTRACT-OWNER)
        (default-to false
            (get is-authorized (map-get? authorized-recorders { recorder: recorder })))
    )
)

;; Check if attendance was already recorded for a student in a slot
(define-read-only (is-attendance-recorded (slot-id uint) (student principal))
    (is-some (map-get? attendance-records { slot-id: slot-id, student: student }))
)

;; Get slot attendance rate (present+late / total * 10000)
(define-read-only (get-slot-attendance-rate (slot-id uint))
    (let ((summary (get-slot-summary slot-id)))
        (if (> (get total-recorded summary) u0)
            (/ (* (+ (get present-count summary) (get late-count summary)) u10000)
               (get total-recorded summary))
            u0)
    )
)
