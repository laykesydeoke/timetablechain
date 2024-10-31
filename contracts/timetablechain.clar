;; TimeChain Marketplace: Teaching Slot Token Contract
;; Implements SIP-009 NFT standard for teaching slot management

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-ALREADY-EXISTS (err u409))
(define-constant ERR-INVALID-INPUT (err u400))

;; SIP-009 NFT Interface
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Data Variables
(define-data-var last-token-id uint u0)
(define-data-var contract-paused bool false)

;; Data Maps
(define-map tokens-data
    uint  ;; token-id
    {
        owner: principal,
        time-block: uint,
        subject: (string-ascii 64),
        grade: uint,
        room-id: uint,
        qualifications: (list 10 (string-ascii 64)),
        is-active: bool,
        created-at: uint,
        updated-at: uint
    }
)

(define-map teacher-slots 
    principal  ;; teacher address
    (list 100 uint)  ;; list of token IDs
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
    (get owner (map-get? tokens-data token-id))
)

(define-read-only (get-last-token-id)
    (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
    (ok (some 
        (concat "https://api.timechain-marketplace.com/metadata/" 
                (uint-to-ascii token-id))))
)

(define-read-only (get-owner (token-id uint))
    (match (map-get? tokens-data token-id)
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
                          (qualifications (list 10 (string-ascii 64))))
    (let ((token-id (+ (var-get last-token-id) u1)))
        (map-set tokens-data token-id
            {
                owner: recipient,
                time-block: time-block,
                subject: subject,
                grade: grade,
                room-id: room-id,
                qualifications: qualifications,
                is-active: true,
                created-at: block-height,
                updated-at: block-height
            }
        )
        (var-set last-token-id token-id)
        (match (map-get? teacher-slots recipient)
            existing-slots (map-set teacher-slots 
                                  recipient 
                                  (unwrap-panic (as-max-len? (append existing-slots token-id) u100)))
            (map-set teacher-slots recipient (list token-id))
        )
        (ok token-id)
    )
)

(define-public (create-teaching-slot 
                (time-block uint)
                (subject (string-ascii 64))
                (grade uint)
                (room-id uint)
                (qualifications (list 10 (string-ascii 64))))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-NOT-AUTHORIZED)
        (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
        (asserts! (>= time-block block-height) ERR-INVALID-INPUT)
        (mint-token tx-sender time-block subject grade room-id qualifications)
    )
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
    (begin
        (asserts! (not (var-get contract-paused)) ERR-NOT-AUTHORIZED)
        (asserts! (is-token-owner token-id) ERR-NOT-AUTHORIZED)
        (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
        
        ;; Update token ownership
        (match (map-get? tokens-data token-id)
            token (begin
                ;; Remove from sender's slots
                (match (map-get? teacher-slots sender)
                    sender-slots 
                        (map-set teacher-slots 
                            sender 
                            (filter (lambda (id) (not (is-eq id token-id))) sender-slots))
                    (err ERR-NOT-FOUND))
                
                ;; Add to recipient's slots
                (match (map-get? teacher-slots recipient)
                    recipient-slots 
                        (map-set teacher-slots 
                            recipient 
                            (unwrap-panic (as-max-len? 
                                (append recipient-slots token-id) u100)))
                    (map-set teacher-slots recipient (list token-id)))
                
                ;; Update token data
                (map-set tokens-data token-id
                    (merge token {
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

;; Utility Functions
(define-private (uint-to-ascii (value uint))
    (concat (unwrap-panic (element-at 
        (list "0" "1" "2" "3" "4" "5" "6" "7" "8" "9")
        (mod value u10)))
        (if (< value u10)
            ""
            (uint-to-ascii (/ value u10))))
)
