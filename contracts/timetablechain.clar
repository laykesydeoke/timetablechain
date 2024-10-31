;; TimeChain Marketplace: Teaching Slot Token Contract
;; Basic implementation without external trait dependency

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-EXISTS (err u409))
(define-constant ERR-INVALID-INPUT (err u400))

;; Data Variables
(define-data-var last-token-id uint u0)
(define-data-var contract-paused bool false)
(define-data-var base-uri (string-utf8 256) "https://api.timechain-marketplace.com/metadata/")

;; Define Token Types
(define-data-var token-type-teaching-slot uint u1)

;; Data Maps
(define-map tokens 
    {token-id: uint} 
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

(define-map qualifications
    {token-id: uint}
    (list 10 (string-ascii 64))
)

(define-map teacher-slots 
    {teacher: principal} 
    (list 100 uint)
)

;; Authorization Functions
(define-private (is-contract-owner)
    (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (is-token-owner (token-id uint))
    (match (get-token-owner token-id)
        owner (is-eq tx-sender owner)
        false
    )
)

;; Token Management Functions
(define-private (get-token-owner (token-id uint))
    (match (map-get? tokens {token-id: token-id})
        token (some (get owner token))
        none
    )
)

(define-read-only (get-last-token-id)
    (ok (var-get last-token-id))
)

(define-read-only (get-owner (token-id uint))
    (match (map-get? tokens {token-id: token-id})
        token (ok (some (get owner token)))
        (err ERR-NOT-FOUND)
    )
)

;; Slot Operations
(define-private (mint-token (recipient principal) 
                          (time-block uint)
                          (subject (string-ascii 64))
                          (grade uint)
                          (room-id uint)
                          (quals (list 10 (string-ascii 64))))
    (let ((token-id (+ (var-get last-token-id) u1)))
        ;; Set token data
        (map-set tokens 
            {token-id: token-id}
            {
                owner: recipient,
                time-block: time-block,
                subject: subject,
                grade: grade,
                room-id: room-id,
                is-active: true,
                created-at: block-height,
                updated-at: block-height
            }
        )
        
        ;; Set qualifications separately
        (map-set qualifications
            {token-id: token-id}
            quals
        )
        
        ;; Update teacher's slot list
        (match (map-get? teacher-slots {teacher: recipient})
            existing-slots (map-set teacher-slots 
                {teacher: recipient}
                (unwrap-panic (as-max-len? (append existing-slots token-id) u100)))
            (map-set teacher-slots {teacher: recipient} (list token-id))
        )
        
        (var-set last-token-id token-id)
        (ok token-id)
    )
)

(define-public (create-teaching-slot 
                (time-block uint)
                (subject (string-ascii 64))
                (grade uint)
                (room-id uint)
                (quals (list 10 (string-ascii 64))))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-NOT-AUTHORIZED)
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (asserts! (>= time-block block-height) ERR-INVALID-INPUT)
        (mint-token tx-sender time-block subject grade room-id quals)
    )
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
    (let ((token (map-get? tokens {token-id: token-id})))
        (match token
            slot-data (begin
                (asserts! (not (var-get contract-paused)) ERR-NOT-AUTHORIZED)
                (asserts! (is-token-owner token-id) ERR-NOT-AUTHORIZED)
                (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
                
                ;; Remove from sender's slots
                (match (map-get? teacher-slots {teacher: sender})
                    sender-slots 
                        (map-set teacher-slots 
                            {teacher: sender}
                            (filter (lambda (id) (not (is-eq id token-id))) sender-slots))
                    (err ERR-NOT-FOUND))
                
                ;; Add to recipient's slots
                (match (map-get? teacher-slots {teacher: recipient})
                    recipient-slots 
                        (map-set teacher-slots 
                            {teacher: recipient}
                            (unwrap-panic (as-max-len? 
                                (append recipient-slots token-id) u100)))
                    (map-set teacher-slots {teacher: recipient} (list token-id)))
                
                ;; Update token data
                (map-set tokens 
                    {token-id: token-id}
                    (merge slot-data {
                        owner: recipient,
                        updated-at: block-height
                    }))
                (ok true))
            (err ERR-NOT-FOUND))
    )
)

;; Administrative Functions
(define-public (toggle-contract-pause)
    (begin
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (ok (var-set contract-paused (not (var-get contract-paused))))
    )
)

;; Read-Only Functions
(define-read-only (get-slot-details (token-id uint))
    (match (map-get? tokens {token-id: token-id})
        slot (ok {
            slot: slot,
            qualifications: (map-get? qualifications {token-id: token-id})
        })
        (err ERR-NOT-FOUND)
    )
)

(define-read-only (get-teacher-slots (teacher principal))
    (match (map-get? teacher-slots {teacher: teacher})
        slots (ok slots)
        (ok (list))
    )
)
