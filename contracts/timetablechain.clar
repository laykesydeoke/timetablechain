;; TimeChain Marketplace: Teaching Slot Token Contract
;; Clarity 4 - Security-optimized implementation

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-EXISTS (err u409))
(define-constant ERR-INVALID-INPUT (err u400))
(define-constant ERR-INVALID-GRADE (err u402))
(define-constant ERR-INVALID-ROOM (err u403))
(define-constant ERR-INVALID-RECIPIENT (err u405))
(define-constant ERR-INVALID-TOKEN (err u406))
;; Distinct error codes for specific failure modes
(define-constant ERR-CONTRACT-PAUSED (err u410))
(define-constant ERR-NOT-SLOT-OWNER (err u411))
(define-constant ERR-SLOT-EXPIRED (err u412))

;; Data Variables
(define-data-var last-token-id uint u0)
(define-data-var contract-paused bool false)

;; Data Maps
(define-map tokens
    {id: uint}
    {
        owner: principal,
        time-block: uint,
        subject: (string-ascii 64),
        grade: uint,
        room-id: uint,
        is-active: bool,
        created-at: uint,
        updated-at: uint
    }
)

(define-map teacher-slots
    {id: principal}
    (list 100 uint)
)

;; Role-based access: authorized teachers who can create slots
(define-map authorized-teachers
    {teacher: principal}
    {is-authorized: bool}
)

;; Transfer history
(define-data-var transfer-counter uint u0)
(define-map transfer-history
    {id: uint}
    {
        token-id: uint,
        from: principal,
        to: principal,
        transferred-at: uint
    }
)

;; Search indexes: map subject/grade/room to list of token-ids
(define-map subject-index
    {subject: (string-ascii 64)}
    (list 200 uint)
)

(define-map grade-index
    {grade: uint}
    (list 200 uint)
)

(define-map room-index
    {room-id: uint}
    (list 200 uint)
)

;; Count of active (non-deactivated) slots
(define-data-var active-slot-count uint u0)

;; Room schedule: prevent double-booking (room + time-block -> token-id)
(define-map room-schedule
    {room-id: uint, time-block: uint}
    {token-id: uint}
)

;; Teacher statistics tracking
(define-map teacher-stats
    {teacher: principal}
    {
        total-created: uint,
        total-transferred-out: uint,
        total-transferred-in: uint,
        total-swapped: uint,
        active-count: uint
    }
)

;; Validation Functions
(define-private (is-valid-grade (grade uint))
    (and (>= grade u1) (<= grade u12))
)

(define-private (is-valid-room (room-id uint))
    (and (> room-id u0) (<= room-id u1000))
)

(define-private (is-valid-subject (subject (string-ascii 64)))
    (and
        (> (len subject) u0)
        (<= (len subject) u64)
    )
)

(define-private (is-valid-token-id (token-id uint))
    (and
        (> token-id u0)
        (<= token-id (var-get last-token-id))
    )
)

(define-private (is-valid-recipient (recipient principal))
    (not (is-eq recipient tx-sender))
)

(define-private (is-contract-owner)
    (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (is-valid-time-block (time-block uint))
    (and
        (>= time-block stacks-block-height)
        (<= time-block (+ stacks-block-height u52560))
    )
)

(define-private (is-slot-expired (token-id uint))
    (match (map-get? tokens {id: token-id})
        token-data (> stacks-block-height (get time-block token-data))
        true))

;; Check if a room+time-block combination already has an active slot
(define-private (has-room-conflict (room-id uint) (time-block uint))
    (is-some (map-get? room-schedule {room-id: room-id, time-block: time-block}))
)

;; Check if a slot is transferable (active and not expired)
(define-private (is-slot-transferable (token-id uint))
    (match (map-get? tokens {id: token-id})
        token-data (and
            (get is-active token-data)
            (not (> stacks-block-height (get time-block token-data))))
        false)
)

;; Check if caller is authorized to create slots
(define-private (can-create-slot)
    (or
        (is-contract-owner)
        (default-to false
            (get is-authorized (map-get? authorized-teachers {teacher: tx-sender})))
    )
)

;; Remove a token-id from a list (returns new list without that id)
(define-private (filter-token-id (current-id uint))
    (not (is-eq current-id (var-get filter-target)))
)
(define-data-var filter-target uint u0)

;; Admin Functions

;; Authorize a teacher to create slots
(define-public (authorize-teacher (teacher principal))
    (begin
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (asserts! (not (is-eq teacher CONTRACT-OWNER)) ERR-INVALID-INPUT)
        (ok (map-set authorized-teachers
            {teacher: teacher}
            {is-authorized: true}
        ))
    )
)

;; Revoke teacher authorization
(define-public (revoke-teacher (teacher principal))
    (begin
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (asserts! (not (is-eq teacher CONTRACT-OWNER)) ERR-INVALID-INPUT)
        (ok (map-set authorized-teachers
            {teacher: teacher}
            {is-authorized: false}
        ))
    )
)

;; Read-Only Functions
(define-read-only (get-token-owner (token-id uint))
    (match (map-get? tokens {id: token-id})
        token-data (ok (get owner token-data))
        ERR-NOT-FOUND
    )
)

(define-read-only (get-slot-details (token-id uint))
    (match (map-get? tokens {id: token-id})
        token-data (ok token-data)
        ERR-NOT-FOUND
    )
)

(define-read-only (get-teacher-slot-list (teacher principal))
    (ok (default-to
        (list)
        (map-get? teacher-slots {id: teacher})
    ))
)

(define-read-only (get-last-token-id)
    (ok (var-get last-token-id))
)

(define-read-only (is-teacher-authorized (teacher principal))
    (ok (or
        (is-eq teacher CONTRACT-OWNER)
        (default-to false
            (get is-authorized (map-get? authorized-teachers {teacher: teacher})))
    ))
)

(define-read-only (is-paused)
    (ok (var-get contract-paused))
)

;; Public Functions

;; Create a teaching slot (deployer or authorized teachers)
(define-public (create-teaching-slot
    (time-block uint)
    (subject (string-ascii 64))
    (grade uint)
    (room-id uint))

    (let
        (
            (new-id (+ (var-get last-token-id) u1))
            (current-slots (default-to (list) (map-get? teacher-slots {id: tx-sender})))
        )

        ;; Input validation
        (asserts! (can-create-slot) ERR-NOT-AUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-valid-time-block time-block) ERR-INVALID-INPUT)
        (asserts! (is-valid-subject subject) ERR-INVALID-INPUT)
        (asserts! (is-valid-grade grade) ERR-INVALID-GRADE)
        (asserts! (is-valid-room room-id) ERR-INVALID-ROOM)
        (asserts! (not (has-room-conflict room-id time-block)) ERR-ALREADY-EXISTS)

        ;; Create token
        (map-set tokens
            {id: new-id}
            {
                owner: tx-sender,
                time-block: time-block,
                subject: subject,
                grade: grade,
                room-id: room-id,
                is-active: true,
                created-at: stacks-block-height,
                updated-at: stacks-block-height
            })

        ;; Update teacher slots
        (map-set teacher-slots
            {id: tx-sender}
            (unwrap! (as-max-len? (append current-slots new-id) u100) ERR-INVALID-INPUT))

        ;; Update subject index
        (map-set subject-index
            {subject: subject}
            (unwrap! (as-max-len?
                (append (default-to (list) (map-get? subject-index {subject: subject})) new-id)
                u200) ERR-INVALID-INPUT))

        ;; Update grade index
        (map-set grade-index
            {grade: grade}
            (unwrap! (as-max-len?
                (append (default-to (list) (map-get? grade-index {grade: grade})) new-id)
                u200) ERR-INVALID-INPUT))

        ;; Update room index
        (map-set room-index
            {room-id: room-id}
            (unwrap! (as-max-len?
                (append (default-to (list) (map-get? room-index {room-id: room-id})) new-id)
                u200) ERR-INVALID-INPUT))

        ;; Register room+time-block to prevent future conflicts
        (map-set room-schedule
            {room-id: room-id, time-block: time-block}
            {token-id: new-id})

        ;; Increment active slot count
        (var-set active-slot-count (+ (var-get active-slot-count) u1))
        (var-set last-token-id new-id)

        ;; Update teacher stats
        (let ((stats (default-to
                {total-created: u0, total-transferred-out: u0, total-transferred-in: u0, total-swapped: u0, active-count: u0}
                (map-get? teacher-stats {teacher: tx-sender}))))
            (map-set teacher-stats {teacher: tx-sender}
                (merge stats {
                    total-created: (+ (get total-created stats) u1),
                    active-count: (+ (get active-count stats) u1)
                })))

        (ok new-id)
    )
)

;; Transfer a slot to another teacher
(define-public (transfer (token-id uint) (recipient principal))
    (let
        (
            (token (unwrap! (map-get? tokens {id: token-id}) ERR-NOT-FOUND))
            (sender-slots (default-to (list) (map-get? teacher-slots {id: tx-sender})))
            (recipient-slots (default-to (list) (map-get? teacher-slots {id: recipient})))
        )

        ;; Input validation
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (is-valid-token-id token-id) ERR-INVALID-TOKEN)
        (asserts! (is-valid-recipient recipient) ERR-INVALID-RECIPIENT)
        (asserts! (is-eq tx-sender (get owner token)) ERR-NOT-SLOT-OWNER)
        (asserts! (get is-active token) ERR-INVALID-TOKEN)
        (asserts! (not (is-slot-expired token-id)) ERR-SLOT-EXPIRED)

        ;; Check if recipient can receive more slots
        (asserts! (is-some (as-max-len? (append recipient-slots token-id) u100))
            ERR-INVALID-INPUT)

        ;; Remove from sender's slot list
        (var-set filter-target token-id)
        (map-set teacher-slots
            {id: tx-sender}
            (filter filter-token-id sender-slots))

        ;; Add to recipient's slot list
        (map-set teacher-slots
            {id: recipient}
            (unwrap! (as-max-len? (append recipient-slots token-id) u100) ERR-INVALID-INPUT))

        ;; Update token ownership
        (map-set tokens
            {id: token-id}
            (merge token {
                owner: recipient,
                updated-at: stacks-block-height
            }))

        ;; Record transfer history
        (let ((tid (+ (var-get transfer-counter) u1)))
            (var-set transfer-counter tid)
            (map-set transfer-history
                {id: tid}
                {
                    token-id: token-id,
                    from: tx-sender,
                    to: recipient,
                    transferred-at: stacks-block-height
                }))

        ;; Update sender stats (transferred out, active-count -1)
        (let ((sender-stats (default-to
                {total-created: u0, total-transferred-out: u0, total-transferred-in: u0, total-swapped: u0, active-count: u0}
                (map-get? teacher-stats {teacher: tx-sender}))))
            (map-set teacher-stats {teacher: tx-sender}
                (merge sender-stats {
                    total-transferred-out: (+ (get total-transferred-out sender-stats) u1),
                    active-count: (if (> (get active-count sender-stats) u0)
                        (- (get active-count sender-stats) u1)
                        u0)
                })))

        ;; Update receiver stats (transferred in, active-count +1)
        (let ((recv-stats (default-to
                {total-created: u0, total-transferred-out: u0, total-transferred-in: u0, total-swapped: u0, active-count: u0}
                (map-get? teacher-stats {teacher: recipient}))))
            (map-set teacher-stats {teacher: recipient}
                (merge recv-stats {
                    total-transferred-in: (+ (get total-transferred-in recv-stats) u1),
                    active-count: (+ (get active-count recv-stats) u1)
                })))

        (ok true)
    )
)

;; Deactivate a slot
(define-public (deactivate-slot (token-id uint))
    (begin
        (asserts! (is-valid-token-id token-id) ERR-INVALID-TOKEN)
        (let (
            (token (unwrap! (map-get? tokens {id: token-id}) ERR-NOT-FOUND))
        )
            (asserts! (is-eq tx-sender (get owner token)) ERR-NOT-SLOT-OWNER)
            (map-set tokens
                {id: token-id}
                (merge token {
                    is-active: false,
                    updated-at: stacks-block-height
                }))
            ;; Decrement active slot count if slot was active
            (if (get is-active token)
                (begin
                    (var-set active-slot-count
                        (if (> (var-get active-slot-count) u0)
                            (- (var-get active-slot-count) u1)
                            u0))
                    ;; Decrement teacher active-count
                    (let ((stats (default-to
                            {total-created: u0, total-transferred-out: u0, total-transferred-in: u0, total-swapped: u0, active-count: u0}
                            (map-get? teacher-stats {teacher: tx-sender}))))
                        (map-set teacher-stats {teacher: tx-sender}
                            (merge stats {
                                active-count: (if (> (get active-count stats) u0)
                                    (- (get active-count stats) u1)
                                    u0)
                            }))))
                true)
            ;; Clear room schedule entry so the room+time-block is available again
            (map-delete room-schedule
                {room-id: (get room-id token), time-block: (get time-block token)})
            (ok true)
        )
    )
)

(define-public (reactivate-slot (token-id uint) (new-time-block uint))
    (begin
        (asserts! (is-valid-token-id token-id) ERR-INVALID-TOKEN)
        (let (
            (token (unwrap! (map-get? tokens {id: token-id}) ERR-NOT-FOUND))
        )
        (asserts! (is-eq tx-sender (get owner token)) ERR-NOT-SLOT-OWNER)
        (asserts! (not (get is-active token)) ERR-ALREADY-EXISTS)
        (asserts! (is-valid-time-block new-time-block) ERR-INVALID-INPUT)
        (asserts! (not (has-room-conflict (get room-id token) new-time-block)) ERR-ALREADY-EXISTS)
        (map-set tokens
            {id: token-id}
            (merge token {
                is-active: true,
                time-block: new-time-block,
                updated-at: stacks-block-height
            }))
        ;; Register new room schedule entry
        (map-set room-schedule
            {room-id: (get room-id token), time-block: new-time-block}
            {token-id: token-id})

        ;; Increment active-count back on reactivation
        (var-set active-slot-count (+ (var-get active-slot-count) u1))
        (let ((stats (default-to
                {total-created: u0, total-transferred-out: u0, total-transferred-in: u0, total-swapped: u0, active-count: u0}
                (map-get? teacher-stats {teacher: tx-sender}))))
            (map-set teacher-stats {teacher: tx-sender}
                (merge stats {
                    active-count: (+ (get active-count stats) u1)
                })))

        (ok true)
        )
    )
)

(define-public (swap-slots (token-a uint) (token-b uint) (partner principal))
    (let (
        (slot-a (unwrap! (map-get? tokens {id: token-a}) ERR-NOT-FOUND))
        (slot-b (unwrap! (map-get? tokens {id: token-b}) ERR-NOT-FOUND))
        (sender-slots (default-to (list) (map-get? teacher-slots {id: tx-sender})))
        (partner-slots (default-to (list) (map-get? teacher-slots {id: partner})))
    )
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (not (is-eq tx-sender partner)) ERR-INVALID-RECIPIENT)
        (asserts! (is-eq tx-sender (get owner slot-a)) ERR-NOT-SLOT-OWNER)
        (asserts! (is-eq partner (get owner slot-b)) ERR-NOT-SLOT-OWNER)
        (asserts! (get is-active slot-a) ERR-INVALID-TOKEN)
        (asserts! (get is-active slot-b) ERR-INVALID-TOKEN)
        (asserts! (not (is-slot-expired token-a)) ERR-SLOT-EXPIRED)
        (asserts! (not (is-slot-expired token-b)) ERR-SLOT-EXPIRED)
        ;; Swap ownership in tokens map
        (map-set tokens {id: token-a}
            (merge slot-a { owner: partner, updated-at: stacks-block-height }))
        (map-set tokens {id: token-b}
            (merge slot-b { owner: tx-sender, updated-at: stacks-block-height }))
        ;; Update sender's slot list: remove token-a, add token-b
        (var-set filter-target token-a)
        (map-set teacher-slots
            {id: tx-sender}
            (unwrap! (as-max-len?
                (append (filter filter-token-id sender-slots) token-b)
                u100) ERR-INVALID-INPUT))
        ;; Update partner's slot list: remove token-b, add token-a
        (var-set filter-target token-b)
        (map-set teacher-slots
            {id: partner}
            (unwrap! (as-max-len?
                (append (filter filter-token-id partner-slots) token-a)
                u100) ERR-INVALID-INPUT))
        ;; Record swap in transfer history (two entries)
        (let ((tid (+ (var-get transfer-counter) u1)))
            (var-set transfer-counter tid)
            (map-set transfer-history
                {id: tid}
                {
                    token-id: token-a,
                    from: tx-sender,
                    to: partner,
                    transferred-at: stacks-block-height
                }))
        (let ((tid2 (+ (var-get transfer-counter) u1)))
            (var-set transfer-counter tid2)
            (map-set transfer-history
                {id: tid2}
                {
                    token-id: token-b,
                    from: partner,
                    to: tx-sender,
                    transferred-at: stacks-block-height
                }))

        ;; Update swap stats for caller
        (let ((caller-stats (default-to
                {total-created: u0, total-transferred-out: u0, total-transferred-in: u0, total-swapped: u0, active-count: u0}
                (map-get? teacher-stats {teacher: tx-sender}))))
            (map-set teacher-stats {teacher: tx-sender}
                (merge caller-stats {
                    total-swapped: (+ (get total-swapped caller-stats) u1)
                })))

        ;; Update swap stats for partner
        (let ((partner-stats (default-to
                {total-created: u0, total-transferred-out: u0, total-transferred-in: u0, total-swapped: u0, active-count: u0}
                (map-get? teacher-stats {teacher: partner}))))
            (map-set teacher-stats {teacher: partner}
                (merge partner-stats {
                    total-swapped: (+ (get total-swapped partner-stats) u1)
                })))

        (ok true)
    )
)

;; Batch create up to 10 slots in one transaction
(define-public (batch-create-slots
    (slots (list 10 {
        time-block: uint,
        subject: (string-ascii 64),
        grade: uint,
        room-id: uint
    })))
    (begin
        (asserts! (can-create-slot) ERR-NOT-AUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (> (len slots) u0) ERR-INVALID-INPUT)
        (ok (map create-slot-from-tuple slots))
    )
)

(define-private (create-slot-from-tuple
    (slot {
        time-block: uint,
        subject: (string-ascii 64),
        grade: uint,
        room-id: uint
    }))
    (let (
        (new-id (+ (var-get last-token-id) u1))
        (current-slots (default-to (list) (map-get? teacher-slots {id: tx-sender})))
        (tb (get time-block slot))
        (subj (get subject slot))
        (gr (get grade slot))
        (rm (get room-id slot))
    )
        (if (and
                (is-valid-time-block tb)
                (is-valid-subject subj)
                (is-valid-grade gr)
                (is-valid-room rm)
                (is-some (as-max-len? (append current-slots new-id) u100)))
            (begin
                (map-set tokens {id: new-id}
                    {
                        owner: tx-sender,
                        time-block: tb,
                        subject: subj,
                        grade: gr,
                        room-id: rm,
                        is-active: true,
                        created-at: stacks-block-height,
                        updated-at: stacks-block-height
                    })
                (map-set teacher-slots {id: tx-sender}
                    (unwrap-panic (as-max-len? (append current-slots new-id) u100)))
                (map-set subject-index {subject: subj}
                    (unwrap-panic (as-max-len?
                        (append (default-to (list) (map-get? subject-index {subject: subj})) new-id)
                        u200)))
                (map-set grade-index {grade: gr}
                    (unwrap-panic (as-max-len?
                        (append (default-to (list) (map-get? grade-index {grade: gr})) new-id)
                        u200)))
                (map-set room-index {room-id: rm}
                    (unwrap-panic (as-max-len?
                        (append (default-to (list) (map-get? room-index {room-id: rm})) new-id)
                        u200)))
                (var-set active-slot-count (+ (var-get active-slot-count) u1))
                (var-set last-token-id new-id)
                new-id)
            u0)
    )
)

;; Batch deactivate up to 10 owned slots
(define-public (batch-deactivate-slots (token-ids (list 10 uint)))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
        (asserts! (> (len token-ids) u0) ERR-INVALID-INPUT)
        (ok (map deactivate-slot-if-owner token-ids))
    )
)

(define-private (deactivate-slot-if-owner (token-id uint))
    (match (map-get? tokens {id: token-id})
        token-data
            (if (is-eq tx-sender (get owner token-data))
                (begin
                    (map-set tokens {id: token-id}
                        (merge token-data {
                            is-active: false,
                            updated-at: stacks-block-height
                        }))
                    (if (get is-active token-data)
                        (var-set active-slot-count
                            (if (> (var-get active-slot-count) u0)
                                (- (var-get active-slot-count) u1)
                                u0))
                        true)
                    true)
                false)
        false)
)

(define-public (toggle-pause)
    (begin
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (ok (var-set contract-paused (not (var-get contract-paused))))
    )
)

(define-read-only (is-slot-expired-ro (token-id uint))
    (ok (is-slot-expired token-id)))

(define-read-only (get-transfer-record (id uint))
    (map-get? transfer-history {id: id})
)

(define-read-only (get-transfer-count)
    (ok (var-get transfer-counter))
)

;; Check whether two teachers' slot lists reflect a completed swap
(define-read-only (get-slots-owned-by (teacher principal))
    (ok (default-to
        (list)
        (map-get? teacher-slots {id: teacher})
    ))
)

;; Return whether a slot is both active and not expired
(define-read-only (is-slot-transferable-ro (token-id uint))
    (ok (is-slot-transferable token-id))
)

;; Search: get token-ids for a given subject
(define-read-only (get-slots-by-subject (subject (string-ascii 64)))
    (ok (default-to (list) (map-get? subject-index {subject: subject})))
)

;; Search: get token-ids for a given grade
(define-read-only (get-slots-by-grade (grade uint))
    (ok (default-to (list) (map-get? grade-index {grade: grade})))
)

;; Search: get token-ids for a given room
(define-read-only (get-slots-by-room (room-id uint))
    (ok (default-to (list) (map-get? room-index {room-id: room-id})))
)

;; Count of active (non-deactivated) slots
(define-read-only (get-active-slot-count)
    (ok (var-get active-slot-count))
)

;; Check if a room+time-block would conflict with an existing active slot
(define-read-only (has-scheduling-conflict (room-id uint) (time-block uint))
    (ok (has-room-conflict room-id time-block))
)

;; Get teacher statistics
(define-read-only (get-teacher-stats (teacher principal))
    (ok (default-to
        {
            total-created: u0,
            total-transferred-out: u0,
            total-transferred-in: u0,
            total-swapped: u0,
            active-count: u0
        }
        (map-get? teacher-stats {teacher: teacher})
    ))
)
