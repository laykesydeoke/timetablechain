;; Slot Marketplace: Payment-enabled marketplace for buying/selling teaching slots with STX
;; Clarity 3 - Works alongside timetablechain contract

;; Constants
(define-constant CONTRACT-OWNER tx-sender)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-LISTING-NOT-FOUND (err u404))
(define-constant ERR-INSUFFICIENT-FUNDS (err u402))
(define-constant ERR-LISTING-EXPIRED (err u410))
(define-constant ERR-SELF-PURCHASE (err u405))
(define-constant ERR-NOT-ACTIVE (err u406))
(define-constant ERR-INVALID-PRICE (err u400))
(define-constant ERR-INVALID-LISTING-ID (err u407))
(define-constant ERR-ALREADY-LISTED (err u409))

;; Data Variables
(define-data-var listing-counter uint u0)

;; Marketplace fee in basis points (250 = 2.5%)
(define-data-var marketplace-fee uint u250)

;; Maximum listing duration in blocks (~30 days at 1 block/10 min)
(define-constant MAX-LISTING-DURATION u4320)

;; Listings map: id -> listing details
(define-map listings
    {id: uint}
    {
        seller: principal,
        token-id: uint,
        price: uint,
        is-active: bool,
        created-at: uint,
        expires-at: uint
    }
)

;; Track which token-ids are currently listed (to prevent double-listing)
(define-map listed-tokens
    {token-id: uint}
    {listing-id: uint}
)

;; Validation helpers
(define-private (is-valid-listing-id (id uint))
    (and (> id u0) (<= id (var-get listing-counter)))
)

(define-private (is-contract-owner)
    (is-eq tx-sender CONTRACT-OWNER)
)

(define-private (is-valid-price (price uint))
    (> price u0)
)

(define-private (is-valid-fee (fee uint))
    ;; Fee must be between 0 and 1000 basis points (0% to 10%)
    (<= fee u1000)
)

;; Calculate fee amount from a price
(define-private (calculate-fee (price uint))
    (/ (* price (var-get marketplace-fee)) u10000)
)

;; ============================================================
;; Public Functions
;; ============================================================

;; List a teaching slot for sale
;; Seller must own the token in the timetablechain contract
(define-public (list-slot (token-id uint) (price uint))
    (begin
        (asserts! (is-valid-price price) ERR-INVALID-PRICE)
        (asserts! (> token-id u0) ERR-INVALID-PRICE)
        ;; Verify caller owns the slot in timetablechain
        (let (
            (owner-result (contract-call? .timetablechain get-token-owner token-id))
        )
            (asserts! (is-ok owner-result) ERR-LISTING-NOT-FOUND)
            (asserts! (is-eq (some tx-sender) (ok-or-none owner-result)) ERR-NOT-AUTHORIZED)
            ;; Prevent double-listing of the same token
            (asserts! (is-none (map-get? listed-tokens {token-id: token-id})) ERR-ALREADY-LISTED)
            ;; Create the listing
            (let (
                (new-id (+ (var-get listing-counter) u1))
                (expires (+ stacks-block-height MAX-LISTING-DURATION))
            )
                (map-set listings
                    {id: new-id}
                    {
                        seller: tx-sender,
                        token-id: token-id,
                        price: price,
                        is-active: true,
                        created-at: stacks-block-height,
                        expires-at: expires
                    })
                (map-set listed-tokens {token-id: token-id} {listing-id: new-id})
                (var-set listing-counter new-id)
                (ok new-id)
            )
        )
    )
)

;; Helper to extract value from ok response
(define-private (ok-or-none (result (response principal uint)))
    (match result
        v (some v)
        e none
    )
)

;; Cancel a listing - only the seller can cancel
(define-public (cancel-listing (listing-id uint))
    (begin
        (asserts! (is-valid-listing-id listing-id) ERR-INVALID-LISTING-ID)
        (let (
            (listing (unwrap! (map-get? listings {id: listing-id}) ERR-LISTING-NOT-FOUND))
        )
            (asserts! (is-eq tx-sender (get seller listing)) ERR-NOT-AUTHORIZED)
            (asserts! (get is-active listing) ERR-NOT-ACTIVE)
            ;; Mark listing inactive
            (map-set listings
                {id: listing-id}
                (merge listing {is-active: false}))
            ;; Remove from listed-tokens index
            (map-delete listed-tokens {token-id: (get token-id listing)})
            (ok true)
        )
    )
)

;; Buy a listed slot using STX
;; Transfers price - fee to seller, fee to contract owner
(define-public (buy-slot (listing-id uint))
    (begin
        (asserts! (is-valid-listing-id listing-id) ERR-INVALID-LISTING-ID)
        (let (
            (listing (unwrap! (map-get? listings {id: listing-id}) ERR-LISTING-NOT-FOUND))
        )
            (asserts! (get is-active listing) ERR-NOT-ACTIVE)
            (asserts! (not (is-eq tx-sender (get seller listing))) ERR-SELF-PURCHASE)
            (asserts! (<= stacks-block-height (get expires-at listing)) ERR-LISTING-EXPIRED)
            (let (
                (price (get price listing))
                (seller (get seller listing))
                (token-id (get token-id listing))
                (fee-amount (calculate-fee price))
                (seller-amount (- price fee-amount))
            )
                ;; Transfer fee to contract owner
                (asserts! (>= fee-amount u0) ERR-INSUFFICIENT-FUNDS)
                (if (> fee-amount u0)
                    (try! (stx-transfer? fee-amount tx-sender CONTRACT-OWNER))
                    true)
                ;; Transfer remaining amount to seller
                (try! (stx-transfer? seller-amount tx-sender seller))
                ;; Transfer slot ownership in timetablechain
                (try! (contract-call? .timetablechain transfer token-id tx-sender))
                ;; Mark listing inactive and remove from index
                (map-set listings
                    {id: listing-id}
                    (merge listing {is-active: false}))
                (map-delete listed-tokens {token-id: token-id})
                (ok true)
            )
        )
    )
)
