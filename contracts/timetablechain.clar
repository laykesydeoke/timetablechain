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

        (var-set last-token-id new-id)
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

        (ok true)
    )
)

;; Deactivate a slot
(define-public (deactivate-slot (token-id uint))
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
        (ok true)
    )
)

(define-public (reactivate-slot (token-id uint) (new-time-block uint))
    (let (
        (token (unwrap! (map-get? tokens {id: token-id}) ERR-NOT-FOUND))
    )
        (asserts! (is-eq tx-sender (get owner token)) ERR-NOT-SLOT-OWNER)
        (asserts! (not (get is-active token)) ERR-ALREADY-EXISTS)
        (asserts! (is-valid-time-block new-time-block) ERR-INVALID-INPUT)
        (map-set tokens
            {id: token-id}
            (merge token {
                is-active: true,
                time-block: new-time-block,
                updated-at: stacks-block-height
            }))
        (ok true)
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
        (ok true)
    )
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
