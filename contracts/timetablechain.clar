;; Teaching Slot Token Contract
;; Implements NFT functionality with teaching slot specific features

;; Define NFT trait
(define-trait nft-trait
    (
        ;; Last token ID
        (get-last-token-id () (response uint uint))

        ;; Get token URI
        (get-token-uri (uint) (response (optional (string-utf8 256)) uint))

        ;; Get the owner of a token
        (get-owner (uint) (response (optional principal) uint))

        ;; Transfer token
        (transfer (uint principal principal) (response bool uint))
    )
)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-LISTED (err u409))
(define-constant ERR-INVALID-TIME (err u400))

;; Data Variables
(define-data-var last-token-id uint u0)
(define-data-var token-uri (string-utf8 256) "")

;; Data Maps
(define-map token-owners 
    principal 
    (list 100 uint)
)

(define-map slot-details
    uint
    {
        teacher: principal,
        time-block: uint,
        subject: (string-ascii 64),
        grade: uint,
        room-id: uint,
        qualifications: (list 10 (string-ascii 64)),
        is-active: bool,
        created-at: uint,
        last-modified: uint
    }
)

(define-map approved-operators 
    {token-id: uint, operator: principal} 
    bool
)

;; NFT Trait Implementation
(define-read-only (get-last-token-id)
    (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
    (ok (some (var-get token-uri)))
)

(define-read-only (get-owner (token-id uint))
    (match (get-slot-details token-id)
        slot (ok (some (get teacher slot)))
        (err ERR-NOT-FOUND)
    )
)

;; Custom Read Functions
(define-read-only (get-slot-details (token-id uint))
    (map-get? slot-details token-id)
)

(define-read-only (get-teacher-slots (teacher principal))
    (default-to (list) (map-get? token-owners teacher))
)

(define-read-only (is-approved (token-id uint) (operator principal))
    (default-to false (map-get? approved-operators {token-id: token-id, operator: operator}))
)

;; Write Functions
(define-public (create-slot 
        (time-block uint)
        (subject (string-ascii 64))
        (grade uint)
        (room-id uint)
        (qualifications (list 10 (string-ascii 64))))
    (let
        (
            (new-id (+ (var-get last-token-id) u1))
            (current-time (get-block-height))
        )
        (asserts! (is-valid-time-block time-block) (err ERR-INVALID-TIME))
        (asserts! (is-eq tx-sender CONTRACT-OWNER) (err ERR-NOT-AUTHORIZED))
        
        ;; Update token ID counter
        (var-set last-token-id new-id)
        
        ;; Create new slot details
        (map-set slot-details new-id {
            teacher: tx-sender,
            time-block: time-block,
            subject: subject,
            grade: grade,
            room-id: room-id,
            qualifications: qualifications,
            is-active: true,
            created-at: current-time,
            last-modified: current-time
        })
        
        ;; Update teacher's token list
        (let
            (
                (current-tokens (get-teacher-slots tx-sender))
            )
            (map-set token-owners 
                tx-sender 
                (append current-tokens new-id)
            )
        )
        
        (ok new-id)
    )
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
    (let
        (
            (owner (unwrap! (get-owner token-id) (err ERR-NOT-FOUND)))
        )
        ;; Ensure the sender is authorized
        (asserts! (and 
            (is-some owner)
            (is-eq (some sender) owner)
        ) (err ERR-NOT-AUTHORIZED))
        
        ;; Remove token from current owner's list
        (let
            (
                (current-tokens (get-teacher-slots sender))
                (new-tokens (filter not-token-id current-tokens token-id))
            )
            (map-set token-owners 
                sender 
                new-tokens
            )
        )
        
        ;; Add token to recipient's list
        (let
            (
                (recipient-tokens (get-teacher-slots recipient))
            )
            (map-set token-owners 
                recipient 
                (append recipient-tokens token-id)
            )
        )
        
        ;; Update slot details
        (let
            (
                (slot (unwrap! (get-slot-details token-id) (err ERR-NOT-FOUND)))
            )
            (map-set slot-details token-id
                (merge slot {
                    teacher: recipient,
                    last-modified: (get-block-height)
                })
            )
        )
        
        (ok true)
    )
)

(define-public (set-approved (token-id uint) (operator principal) (approved bool))
    (let
        (
            (owner (unwrap! (get-owner token-id) (err ERR-NOT-AUTHORIZED)))
        )
        (asserts! (and 
            (is-some owner)
            (is-eq (some tx-sender) owner)
        ) (err ERR-NOT-AUTHORIZED))
        
        (map-set approved-operators
            {token-id: token-id, operator: operator}
            approved
        )
        
        (ok true)
    )
)

;; Internal Functions
(define-private (is-valid-time-block (time-block uint))
    (and
        (>= time-block (get-block-height))
        (<= time-block (+ (get-block-height) (* u144 u365))) ;; Max 1 year ahead
    )
)

(define-private (not-token-id (id uint) (target uint))
    (not (is-eq id target))
)

;; Initialize Contract
(begin
    (var-set token-uri "https://api.timechain-marketplace.com/metadata/")
)
