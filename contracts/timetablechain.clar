;; TimeChain Marketplace: Teaching Slot Token Contract
;; Security-optimized implementation

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

;; Validation Functions
(define-private (is-valid-grade (grade uint))
    (and (>= grade u1) (<= grade u12))  ;; Assuming grades 1-12
)

(define-private (is-valid-room (room-id uint))
    (and (> room-id u0) (<= room-id u1000))  ;; Assuming max 1000 rooms
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

;; Validation Functions
(define-private (is-valid-recipient (recipient principal))
    (and 
        (not (is-eq recipient tx-sender))  ;; Can't transfer to self
        (not (is-eq recipient CONTRACT-OWNER))  ;; Can't transfer to contract
    )
)

;; Read-Only Functions
(define-read-only (get-token-owner (token-id uint))
    (ok (get owner 
        (default-to
            {
                owner: CONTRACT-OWNER,
                time-block: u0,
                subject: "",
                grade: u0,
                room-id: u0,
                is-active: false,
                created-at: u0,
                updated-at: u0
            }
            (map-get? tokens {id: token-id})
        )
    ))
)

(define-read-only (get-slot-details (token-id uint))
    (ok (default-to
        {
            owner: CONTRACT-OWNER,
            time-block: u0,
            subject: "",
            grade: u0,
            room-id: u0,
            is-active: false,
            created-at: u0,
            updated-at: u0
        }
        (map-get? tokens {id: token-id})
    ))
)

(define-read-only (get-teacher-slot-list (teacher principal))
    (ok (default-to 
        (list) 
        (map-get? teacher-slots {id: teacher})
    ))
)

;; Private Functions
(define-private (is-contract-owner)
    (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (is-valid-time-block (time-block uint))
    (and 
        (>= time-block block-height)
        (<= time-block (+ block-height u52560))  ;; Max 1 year ahead (52560 blocks)
    )
)

;; Public Functions
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
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (asserts! (not (var-get contract-paused)) ERR-NOT-AUTHORIZED)
        (asserts! (is-valid-time-block time-block) ERR-INVALID-INPUT)
        (asserts! (is-valid-subject subject) ERR-INVALID-INPUT)
        (asserts! (is-valid-grade grade) ERR-INVALID-GRADE)
        (asserts! (is-valid-room room-id) ERR-INVALID-ROOM)

        ;; Create token with validated inputs
        (map-set tokens
            {id: new-id}
            {
                owner: tx-sender,
                time-block: time-block,
                subject: subject,
                grade: grade,
                room-id: room-id,
                is-active: true,
                created-at: block-height,
                updated-at: block-height
            })

        ;; Update teacher slots with bounds checking
        (map-set teacher-slots 
            {id: tx-sender} 
            (unwrap! (as-max-len? (append current-slots new-id) u100) ERR-INVALID-INPUT))

        (var-set last-token-id new-id)
        (ok new-id)
    )
)

(define-public (transfer (token-id uint) (recipient principal))
    (let 
        (
            (token (default-to 
                {
                    owner: CONTRACT-OWNER,
                    time-block: u0,
                    subject: "",
                    grade: u0,
                    room-id: u0,
                    is-active: false,
                    created-at: u0,
                    updated-at: u0
                }
                (map-get? tokens {id: token-id})))
            (sender-slots (default-to (list) (map-get? teacher-slots {id: tx-sender})))
            (recipient-slots (default-to (list) (map-get? teacher-slots {id: recipient})))
        )

        (begin 
            ;; Input validation
            (asserts! (not (var-get contract-paused)) ERR-NOT-AUTHORIZED)
            (asserts! (is-valid-token-id token-id) ERR-INVALID-TOKEN)
            (asserts! (is-valid-recipient recipient) ERR-INVALID-RECIPIENT)
            (asserts! (is-eq tx-sender (get owner token)) ERR-NOT-AUTHORIZED)

            ;; Check if recipient can receive more slots
            (asserts! (is-some (as-max-len? (append recipient-slots token-id) u100))
                ERR-INVALID-INPUT)

            ;; Update recipient's slots
            (map-set teacher-slots
                {id: recipient}
                (unwrap-panic (as-max-len? (append recipient-slots token-id) u100)))

            ;; Update token ownership
            (map-set tokens
                {id: token-id}
                (merge token {
                    owner: recipient,
                    updated-at: block-height
                }))

            (ok true))
    )
)

(define-public (toggle-pause)
    (begin
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (ok (var-set contract-paused (not (var-get contract-paused))))
    )
)
