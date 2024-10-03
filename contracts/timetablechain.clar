;; Teaching Slot Token - Simplified Contract

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))

;; Data Variables
(define-data-var last-token-id uint u0)

;; Data Maps
(define-map slot-details
    uint
    {
        teacher: principal,
        time-block: uint,
        subject: (string-ascii 64),
        grade: uint,
        room-id: uint
    }
)

;; Read Functions
(define-read-only (get-slot-details (token-id uint))
    (ok (map-get? slot-details token-id))
)

(define-read-only (get-owner (token-id uint))
    (let 
        (
            (slot (unwrap! (map-get? slot-details token-id) (err ERR-NOT-FOUND)))
        )
        (ok (get teacher slot))
    )
)

;; Write Functions
(define-public (create-slot 
        (time-block uint)
        (subject (string-ascii 64))
        (grade uint)
        (room-id uint))
    (let
        (
            (new-id (+ (var-get last-token-id) u1))
        )
        (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-NOT-AUTHORIZED))
        
        (var-set last-token-id new-id)
        
        (map-set slot-details new-id {
            teacher: tx-sender,
            time-block: time-block,
            subject: subject,
            grade: grade,
            room-id: room-id
        })
        
        (ok new-id)
    )
)

(define-public (transfer (token-id uint) (recipient principal))
    (let
        (
            (slot (unwrap! (map-get? slot-details token-id) (err ERR-NOT-FOUND)))
        )
        (asserts! (is-eq tx-sender (get teacher slot)) (err ERR-NOT-AUTHORIZED))
        
        (map-set slot-details token-id
            (merge slot { teacher: recipient })
        )
        
        (ok true)
    )
)

(define-private (is-owner (token-id uint) (who principal))
    (let
        (
            (slot (map-get? slot-details token-id))
        )
        (match slot
            s (is-eq who (get teacher s))
            false
        )
    )
)
