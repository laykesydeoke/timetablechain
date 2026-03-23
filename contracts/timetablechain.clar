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
        (asserts! (not (var-get contract-paused)) ERR-NOT-AUTHORIZED)
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
        (asserts! (not (var-get contract-paused)) ERR-NOT-AUTHORIZED)
        (asserts! (is-valid-token-id token-id) ERR-INVALID-TOKEN)
        (asserts! (is-valid-recipient recipient) ERR-INVALID-RECIPIENT)
        (asserts! (is-eq tx-sender (get owner token)) ERR-NOT-AUTHORIZED)

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
            (unwrap-panic (as-max-len? (append recipient-slots token-id) u100)))

        ;; Update token ownership
        (map-set tokens
            {id: token-id}
            (merge token {
                owner: recipient,
                updated-at: stacks-block-height
            }))

        (ok true)
    )
)

;; Deactivate a slot
(define-public (deactivate-slot (token-id uint))
    (let (
        (token (unwrap! (map-get? tokens {id: token-id}) ERR-NOT-FOUND))
    )
        (asserts! (is-eq tx-sender (get owner token)) ERR-NOT-AUTHORIZED)
        (map-set tokens
            {id: token-id}
            (merge token {
                is-active: false,
                updated-at: stacks-block-height
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

;; Slot analytics: protocol usage tracking
(define-data-var total-slots-created uint u0)
(define-data-var total-transfers uint u0)
(define-data-var total-deactivations uint u0)

(define-read-only (get-slot-analytics)
  {
    total-slots: (var-get total-slots-created),
    total-transfers: (var-get total-transfers),
    total-deactivations: (var-get total-deactivations),
    last-token-id: (var-get last-token-id)
  })

(define-read-only (get-teacher-count)
  (var-get last-token-id))

;; Governance: parameter management
(define-data-var max-slots-per-teacher uint u100)
(define-data-var min-time-block uint u1)
(define-data-var governance-action-count uint u0)

(define-read-only (get-governance-params)
  {
    max-slots-per-teacher: (var-get max-slots-per-teacher),
    min-time-block: (var-get min-time-block),
    governance-actions: (var-get governance-action-count)
  })

(define-public (set-max-slots-per-teacher (max uint))
  (begin
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (var-set max-slots-per-teacher max)
    (var-set governance-action-count (+ (var-get governance-action-count) u1))
    (ok true)))

;; Reporting: protocol snapshots
(define-map protocol-snapshots uint { slots: uint, transfers: uint, block-height: uint })
(define-data-var snapshot-count uint u0)

(define-read-only (get-protocol-report)
  {
    total-slots: (var-get total-slots-created),
    total-transfers: (var-get total-transfers),
    snapshot-count: (var-get snapshot-count),
    report-block: stacks-block-height
  })

(define-public (take-protocol-snapshot)
  (let ((count (var-get snapshot-count)))
    (map-set protocol-snapshots count {
      slots: (var-get total-slots-created),
      transfers: (var-get total-transfers),
      block-height: stacks-block-height
    })
    (var-set snapshot-count (+ count u1))
    (ok count)))

(define-read-only (get-protocol-snapshot (id uint))
  (map-get? protocol-snapshots id))

;; Teacher tier rewards based on slot count
(define-map teacher-slot-count principal uint)

(define-read-only (get-teacher-tier (teacher principal))
  (let ((count (default-to u0 (map-get? teacher-slot-count teacher))))
    (if (>= count u10) u3
      (if (>= count u5) u2 u1))))

(define-read-only (get-teacher-tier-name (teacher principal))
  (let ((tier (get-teacher-tier teacher)))
    (if (is-eq tier u3) "gold"
      (if (is-eq tier u2) "silver" "bronze"))))

(define-read-only (get-teacher-bonus-bps (teacher principal))
  (let ((tier (get-teacher-tier teacher)))
    (if (is-eq tier u3) u100
      (if (is-eq tier u2) u50 u0))))

;; Marketplace analytics: active slots and market data
(define-data-var active-slot-count uint u0)
(define-data-var total-unique-teachers uint u0)

(define-read-only (get-marketplace-metrics)
  {
    active-slots: (var-get active-slot-count),
    total-unique-teachers: (var-get total-unique-teachers),
    total-slots: (var-get total-slots-created),
    last-token: (var-get last-token-id)
  })

(define-read-only (get-market-summary)
  {
    is-paused: (var-get contract-paused),
    total-slots: (var-get total-slots-created),
    governance-actions: (var-get governance-action-count),
    snapshot-count: (var-get snapshot-count)
  })

;; Enhanced emergency pause tracking
(define-data-var pause-count uint u0)
(define-data-var last-pause-block uint u0)

(define-read-only (get-pause-state)
  {
    is-paused: (var-get contract-paused),
    pause-count: (var-get pause-count),
    last-pause-block: (var-get last-pause-block)
  })

(define-public (emergency-pause)
  (begin
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (var-set contract-paused true)
    (var-set pause-count (+ (var-get pause-count) u1))
    (var-set last-pause-block stacks-block-height)
    (ok true)))

(define-public (emergency-resume)
  (begin
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (var-set contract-paused false)
    (ok true)))

;; Performance tracking
(define-data-var total-tx-count uint u0)
(define-data-var protocol-start-block uint stacks-block-height)

(define-read-only (get-performance-stats)
  {
    total-slots: (var-get total-slots-created),
    total-transfers: (var-get total-transfers),
    total-tx: (var-get total-tx-count),
    uptime-blocks: (- stacks-block-height (var-get protocol-start-block))
  })

(define-read-only (get-protocol-uptime)
  (- stacks-block-height (var-get protocol-start-block)))

;; Access control roles
(define-map admin-roles principal bool)
(define-data-var role-count uint u0)

(define-read-only (is-admin (addr principal))
  (default-to false (map-get? admin-roles addr)))

(define-read-only (get-access-summary)
  {
    contract-owner: (var-get contract-owner),
    role-count: (var-get role-count),
    is-paused: (var-get contract-paused)
  })

(define-public (grant-admin-role (addr principal))
  (begin
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (map-set admin-roles addr true)
    (var-set role-count (+ (var-get role-count) u1))
    (ok true)))

(define-public (revoke-admin-role (addr principal))
  (begin
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (map-set admin-roles addr false)
    (ok true)))

;; Slot validation rules
(define-map slot-validation-rules uint { min-duration: uint, max-duration: uint, requires-auth: bool })
(define-data-var validation-enabled bool true)
(define-data-var default-min-duration uint u1)
(define-data-var default-max-duration uint u100)

(define-read-only (get-validation-params)
  {
    enabled: (var-get validation-enabled),
    min-duration: (var-get default-min-duration),
    max-duration: (var-get default-max-duration)
  })

(define-read-only (get-slot-rule (slot-id uint))
  (map-get? slot-validation-rules slot-id))

(define-public (set-validation-enabled (enabled bool))
  (begin
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (var-set validation-enabled enabled)
    (ok true)))

(define-public (set-default-duration-range (min uint) (max uint))
  (begin
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (asserts! (< min max) (err u409))
    (var-set default-min-duration min)
    (var-set default-max-duration max)
    (ok true)))

;; Slot pricing system
(define-map slot-prices uint { price: uint, currency: uint, set-at: uint })
(define-data-var pricing-enabled bool true)
(define-data-var default-price uint u1000)
(define-data-var price-count uint u0)

(define-read-only (get-pricing-params)
  { enabled: (var-get pricing-enabled), default-price: (var-get default-price), price-count: (var-get price-count) })

(define-read-only (get-slot-price (slot-id uint))
  (default-to { price: (var-get default-price), currency: u1, set-at: u0 } (map-get? slot-prices slot-id)))

(define-public (set-slot-price (slot-id uint) (price uint))
  (begin
    (asserts! (var-get pricing-enabled) (err u1401))
    (asserts! (> price u0) (err u1402))
    (map-set slot-prices slot-id { price: price, currency: u1, set-at: stacks-block-height })
    (var-set price-count (+ (var-get price-count) u1))
    (ok true)))

(define-public (set-default-price (price uint))
  (begin
    (asserts! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (asserts! (> price u0) (err u1403))
    (var-set default-price price)
    (ok true)))

;; Extended teacher profiles
(define-map teacher-profiles principal { display-name: (string-ascii 64), bio-hash: (buff 32), active: bool, created-at: uint })
(define-data-var profile-count uint u0)

(define-read-only (get-teacher-profile (teacher principal))
  (map-get? teacher-profiles teacher))

(define-read-only (get-profile-stats)
  { profile-count: (var-get profile-count) })

(define-public (create-teacher-profile (display-name (string-ascii 64)) (bio-hash (buff 32)))
  (begin
    (map-set teacher-profiles tx-sender { display-name: display-name, bio-hash: bio-hash, active: true, created-at: stacks-block-height })
    (var-set profile-count (+ (var-get profile-count) u1))
    (ok true)))

(define-public (update-teacher-profile (display-name (string-ascii 64)) (bio-hash (buff 32)))
  (let ((existing (unwrap\! (map-get? teacher-profiles tx-sender) (err u1501))))
    (map-set teacher-profiles tx-sender (merge existing { display-name: display-name, bio-hash: bio-hash }))
    (ok true)))

;; Schedule template system
(define-map schedule-templates uint { creator: principal, name: (string-ascii 32), slot-count: uint, active: bool })
(define-data-var template-count uint u0)

(define-read-only (get-template (id uint))
  (map-get? schedule-templates id))

(define-read-only (get-template-stats)
  { template-count: (var-get template-count) })

(define-public (create-schedule-template (name (string-ascii 32)) (slot-count uint))
  (begin
    (asserts\! (> slot-count u0) (err u1601))
    (let ((id (+ (var-get template-count) u1)))
      (map-set schedule-templates id { creator: tx-sender, name: name, slot-count: slot-count, active: true })
      (var-set template-count id)
      (ok id))))

(define-public (deactivate-template (id uint))
  (let ((tmpl (unwrap\! (map-get? schedule-templates id) (err u1602))))
    (asserts\! (is-eq tx-sender (get creator tmpl)) (err u1603))
    (map-set schedule-templates id (merge tmpl { active: false }))
    (ok true)))

;; Exchange history tracking
(define-map exchange-history uint { from: principal, to: principal, slot-id: uint, exchanged-at: uint, exchange-type: uint })
(define-data-var exchange-count uint u0)
(define-data-var history-enabled bool true)

(define-read-only (get-exchange-history-params)
  { exchange-count: (var-get exchange-count), enabled: (var-get history-enabled) })

(define-read-only (get-exchange-record (id uint))
  (map-get? exchange-history id))

(define-public (record-exchange (from principal) (to principal) (slot-id uint) (exchange-type uint))
  (begin
    (asserts\! (var-get history-enabled) (err u1701))
    (let ((id (+ (var-get exchange-count) u1)))
      (map-set exchange-history id { from: from, to: to, slot-id: slot-id, exchanged-at: stacks-block-height, exchange-type: exchange-type })
      (var-set exchange-count id)
      (ok id))))

;; Slot category system
(define-map slot-categories uint { name: (string-ascii 32), active: bool, slot-count: uint })
(define-data-var category-count uint u0)
(define-map slot-category-assignments uint uint)

(define-read-only (get-category-stats)
  { category-count: (var-get category-count) })

(define-read-only (get-category (id uint))
  (map-get? slot-categories id))

(define-public (create-category (name (string-ascii 32)))
  (begin
    (asserts\! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (let ((id (+ (var-get category-count) u1)))
      (map-set slot-categories id { name: name, active: true, slot-count: u0 })
      (var-set category-count id)
      (ok id))))

(define-public (assign-category (slot-id uint) (category-id uint))
  (begin
    (asserts\! (<= category-id (var-get category-count)) (err u1801))
    (map-set slot-category-assignments slot-id category-id)
    (ok true)))

;; Teacher and slot rating system
(define-map teacher-ratings principal { total-score: uint, rating-count: uint, last-rated: uint })
(define-data-var rating-enabled bool true)
(define-data-var total-ratings uint u0)

(define-read-only (get-rating-params)
  { enabled: (var-get rating-enabled), total-ratings: (var-get total-ratings) })

(define-read-only (get-teacher-rating (teacher principal))
  (default-to { total-score: u0, rating-count: u0, last-rated: u0 } (map-get? teacher-ratings teacher)))

(define-public (rate-teacher (teacher principal) (score uint))
  (begin
    (asserts\! (var-get rating-enabled) (err u1901))
    (asserts\! (<= score u5) (err u1902))
    (let ((current (get-teacher-rating teacher)))
      (map-set teacher-ratings teacher { total-score: (+ (get total-score current) score), rating-count: (+ (get rating-count current) u1), last-rated: stacks-block-height })
      (var-set total-ratings (+ (var-get total-ratings) u1))
      (ok true))))

;; Batch slot operations
(define-data-var batch-size-limit uint u10)
(define-data-var batch-count uint u0)
(define-data-var batch-enabled bool true)

(define-read-only (get-batch-params)
  { batch-limit: (var-get batch-size-limit), batch-count: (var-get batch-count), enabled: (var-get batch-enabled) })

(define-public (start-batch-operation (size uint))
  (begin
    (asserts\! (var-get batch-enabled) (err u2001))
    (asserts\! (<= size (var-get batch-size-limit)) (err u2002))
    (var-set batch-count (+ (var-get batch-count) u1))
    (ok (var-get batch-count))))

(define-public (set-batch-limit (limit uint))
  (begin
    (asserts\! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (asserts\! (> limit u0) (err u2003))
    (var-set batch-size-limit limit)
    (ok true)))

;; On-chain notification flags
(define-map notification-flags principal { transfer-notify: bool, price-change-notify: bool, expiry-notify: bool })
(define-data-var notifications-enabled bool true)
(define-data-var notification-count uint u0)

(define-read-only (get-notification-params)
  { enabled: (var-get notifications-enabled), count: (var-get notification-count) })

(define-read-only (get-notification-prefs (user principal))
  (default-to { transfer-notify: true, price-change-notify: true, expiry-notify: true } (map-get? notification-flags user)))

(define-public (set-notification-prefs (transfer bool) (price-change bool) (expiry bool))
  (begin
    (asserts\! (var-get notifications-enabled) (err u2101))
    (map-set notification-flags tx-sender { transfer-notify: transfer, price-change-notify: price-change, expiry-notify: expiry })
    (var-set notification-count (+ (var-get notification-count) u1))
    (ok true)))

;; On-chain slot events
(define-map slot-events uint { event-type: (string-ascii 32), actor: principal, slot-id: uint, occurred-at: uint })
(define-data-var events-enabled bool true)
(define-data-var event-count uint u0)
(define-read-only (get-event-params)
  { enabled: (var-get events-enabled), count: (var-get event-count) })
(define-read-only (get-slot-event (id uint))
  (map-get? slot-events id))
(define-public (emit-slot-event (event-type (string-ascii 32)) (slot-id uint))
  (begin
    (asserts! (var-get events-enabled) (err u2201))
    (let ((id (+ (var-get event-count) u1)))
      (map-set slot-events id { event-type: event-type, actor: tx-sender, slot-id: slot-id, occurred-at: block-height })
      (var-set event-count id)
      (ok id))))

;; Slot overlap detection
(define-map slot-time-ranges uint { start: uint, end: uint })
(define-data-var overlap-detection-on bool true)
(define-read-only (get-slot-range (slot-id uint))
  (map-get? slot-time-ranges slot-id))
(define-read-only (check-overlap (start1 uint) (end1 uint) (start2 uint) (end2 uint))
  (and (< start1 end2) (< start2 end1)))
(define-public (register-slot-range (slot-id uint) (start uint) (end uint))
  (begin
    (asserts\! (var-get overlap-detection-on) (err u2300))
    (asserts\! (< start end) (err u2301))
    (map-set slot-time-ranges slot-id { start: start, end: end })
    (ok true)))

;; Teacher auth validation
(define-data-var teacher-auth-strict bool true)
(define-map teacher-credentials principal { verified: bool, verified-at: uint, credential-type: uint })
(define-read-only (get-teacher-credential (teacher principal))
  (map-get? teacher-credentials teacher))
(define-read-only (is-teacher-verified (teacher principal))
  (default-to false (get verified (map-get? teacher-credentials teacher))))
(define-public (verify-teacher (teacher principal) (cred-type uint))
  (begin
    (asserts\! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (map-set teacher-credentials teacher { verified: true, verified-at: stacks-block-height, credential-type: cred-type })
    (ok true)))

;; Template parameter bounds
(define-constant MAX-TEMPLATE-SLOTS u50)
(define-constant MAX-TEMPLATE-NAME-LEN u32)
(define-read-only (validate-template-params (name (string-ascii 32)) (slots uint))
  (and (> (len name) u0) (<= slots MAX-TEMPLATE-SLOTS)))
(define-read-only (get-template-bounds)
  { max-slots: MAX-TEMPLATE-SLOTS, max-name: MAX-TEMPLATE-NAME-LEN })

;; Exchange validation
(define-data-var exchange-validation-on bool true)
(define-data-var max-exchanges-per-block uint u10)
(define-map exchange-block-counts uint uint)
(define-read-only (get-exchange-validation-params)
  { enabled: (var-get exchange-validation-on), max-per-block: (var-get max-exchanges-per-block) })
(define-read-only (get-block-exchange-count (block uint))
  (default-to u0 (map-get? exchange-block-counts block)))

;; Category system limits
(define-constant MAX-CATEGORIES u100)
(define-constant MAX-SLOTS-PER-CATEGORY u500)
(define-read-only (get-category-limits)
  { max-categories: MAX-CATEGORIES, max-per-cat: MAX-SLOTS-PER-CATEGORY, current: (var-get category-count) })
(define-read-only (can-add-category)
  (< (var-get category-count) MAX-CATEGORIES))

;; Rating score boundary validation
(define-constant MIN-RATING-SCORE u0)
(define-constant MAX-RATING-SCORE u5)
(define-data-var rating-cooldown uint u10)
(define-map rating-timestamps principal uint)
(define-read-only (get-rating-bounds)
  { min: MIN-RATING-SCORE, max: MAX-RATING-SCORE, cooldown: (var-get rating-cooldown) })
(define-read-only (can-rate (user principal))
  (> (- stacks-block-height (default-to u0 (map-get? rating-timestamps user))) (var-get rating-cooldown)))

;; Batch operation validation
(define-constant BATCH-MIN-SIZE u1)
(define-data-var batch-cooldown uint u5)
(define-map batch-timestamps principal uint)
(define-read-only (get-batch-validation-params)
  { min-size: BATCH-MIN-SIZE, max-size: (var-get batch-size-limit), cooldown: (var-get batch-cooldown) })
(define-read-only (can-start-batch (user principal))
  (> (- stacks-block-height (default-to u0 (map-get? batch-timestamps user))) (var-get batch-cooldown)))

;; Notification toggle improvements
(define-data-var notif-global-override bool false)
(define-data-var notif-rate-limit uint u5)
(define-map notif-change-log uint { user: principal, changed-at: uint })
(define-data-var notif-change-count uint u0)
(define-read-only (get-notif-config)
  { enabled: (var-get notifications-enabled), override: (var-get notif-global-override), rate-limit: (var-get notif-rate-limit) })

;; Pricing range enforcement
(define-constant MIN-SLOT-PRICE u10)
(define-constant MAX-SLOT-PRICE u100000000)
(define-read-only (validate-price-range (price uint))
  (and (>= price MIN-SLOT-PRICE) (<= price MAX-SLOT-PRICE)))
(define-read-only (get-pricing-range)
  { min: MIN-SLOT-PRICE, max: MAX-SLOT-PRICE, default: (var-get default-price) })

;; Schedule collision detection
(define-data-var collision-check-enabled bool true)
(define-map slot-schedules uint { day: uint, period: uint })
(define-read-only (get-slot-schedule (slot-id uint))
  (map-get? slot-schedules slot-id))
(define-read-only (get-collision-params)
  { enabled: (var-get collision-check-enabled) })
(define-public (assign-schedule (slot-id uint) (day uint) (period uint))
  (begin
    (asserts\! (var-get collision-check-enabled) (err u2400))
    (asserts\! (<= day u7) (err u2401))
    (asserts\! (<= period u8) (err u2402))
    (map-set slot-schedules slot-id { day: day, period: period })
    (ok true)))

;; Permission matrix enforcement
(define-map permission-matrix principal { can-create: bool, can-transfer: bool, can-deactivate: bool, can-rate: bool })
(define-read-only (get-permissions (user principal))
  (default-to { can-create: false, can-transfer: true, can-deactivate: true, can-rate: true } (map-get? permission-matrix user)))
(define-public (set-permissions (user principal) (create bool) (transfer bool) (deactivate bool) (rate bool))
  (begin
    (asserts\! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (map-set permission-matrix user { can-create: create, can-transfer: transfer, can-deactivate: deactivate, can-rate: rate })
    (ok true)))

;; Event deduplication
(define-data-var dedup-window uint u10)
(define-map event-fingerprints (buff 32) uint)
(define-read-only (get-dedup-params)
  { window: (var-get dedup-window) })
(define-read-only (event-exists (fingerprint (buff 32)))
  (is-some (map-get? event-fingerprints fingerprint)))
(define-public (register-event-fingerprint (fingerprint (buff 32)))
  (begin
    (map-set event-fingerprints fingerprint stacks-block-height)
    (ok true)))

;; Profile migration support
(define-data-var profile-migration-active bool false)
(define-data-var profiles-migrated uint u0)
(define-map migrated-profiles principal { migrated-at: uint, from-version: uint })
(define-read-only (get-profile-migration-state)
  { active: (var-get profile-migration-active), migrated: (var-get profiles-migrated) })
(define-public (migrate-profile (teacher principal))
  (begin
    (asserts\! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (asserts\! (var-get profile-migration-active) (err u2500))
    (map-set migrated-profiles teacher { migrated-at: stacks-block-height, from-version: u1 })
    (var-set profiles-migrated (+ (var-get profiles-migrated) u1))
    (ok true)))

;; Search index optimization
(define-data-var search-index-version uint u1)
(define-data-var indexed-slots uint u0)
(define-map slot-search-index uint { subject-hash: (buff 32), grade: uint, room: uint, indexed-at: uint })
(define-read-only (get-search-stats)
  { version: (var-get search-index-version), indexed: (var-get indexed-slots) })
(define-public (index-slot (slot-id uint) (subject-hash (buff 32)) (grade uint) (room uint))
  (begin
    (map-set slot-search-index slot-id { subject-hash: subject-hash, grade: grade, room: room, indexed-at: stacks-block-height })
    (var-set indexed-slots (+ (var-get indexed-slots) u1))
    (ok true)))

;; Slot lifecycle management
(define-constant LIFECYCLE-DRAFT u1)
(define-constant LIFECYCLE-ACTIVE u2)
(define-constant LIFECYCLE-EXPIRED u3)
(define-constant LIFECYCLE-ARCHIVED u4)
(define-map slot-lifecycle-state uint uint)
(define-read-only (get-slot-lifecycle (slot-id uint))
  (default-to LIFECYCLE-DRAFT (map-get? slot-lifecycle-state slot-id)))
(define-public (advance-lifecycle (slot-id uint) (new-state uint))
  (begin
    (asserts\! (<= new-state LIFECYCLE-ARCHIVED) (err u2600))
    (map-set slot-lifecycle-state slot-id new-state)
    (ok true)))

;; Calendar alignment utilities
(define-constant BLOCKS-PER-DAY u144)
(define-constant BLOCKS-PER-WEEK u1008)
(define-read-only (block-to-day (block uint))
  (/ block BLOCKS-PER-DAY))
(define-read-only (block-to-week (block uint))
  (/ block BLOCKS-PER-WEEK))
(define-read-only (get-current-period)
  { day: (/ stacks-block-height BLOCKS-PER-DAY), week: (/ stacks-block-height BLOCKS-PER-WEEK), block: stacks-block-height })

;; Recurrence rule engine
(define-constant RECUR-NONE u0)
(define-constant RECUR-DAILY u1)
(define-constant RECUR-WEEKLY u2)
(define-map slot-recurrence uint { recur-type: uint, interval: uint, end-block: uint })
(define-read-only (get-recurrence (slot-id uint))
  (map-get? slot-recurrence slot-id))
(define-public (set-recurrence (slot-id uint) (recur-type uint) (interval uint) (end-block uint))
  (begin
    (asserts\! (<= recur-type RECUR-WEEKLY) (err u2700))
    (asserts\! (> interval u0) (err u2701))
    (map-set slot-recurrence slot-id { recur-type: recur-type, interval: interval, end-block: end-block })
    (ok true)))

;; Waitlist management
(define-data-var waitlist-enabled bool true)
(define-data-var waitlist-count uint u0)
(define-map slot-waitlist uint { count: uint, max-size: uint })
(define-map waitlist-entries uint { user: principal, slot-id: uint, position: uint, added-at: uint })
(define-read-only (get-waitlist-params)
  { enabled: (var-get waitlist-enabled), total: (var-get waitlist-count) })
(define-public (join-waitlist (slot-id uint))
  (begin
    (asserts\! (var-get waitlist-enabled) (err u2800))
    (let ((id (+ (var-get waitlist-count) u1)))
      (map-set waitlist-entries id { user: tx-sender, slot-id: slot-id, position: id, added-at: stacks-block-height })
      (var-set waitlist-count id)
      (ok id))))

;; Audit trail logging
(define-data-var audit-log-enabled bool true)
(define-data-var audit-log-count uint u0)
(define-map audit-entries uint { action: (string-ascii 32), actor: principal, target-id: uint, block: uint })
(define-read-only (get-audit-entry (id uint))
  (map-get? audit-entries id))
(define-read-only (get-audit-params)
  { enabled: (var-get audit-log-enabled), count: (var-get audit-log-count) })
(define-public (log-audit-event (action (string-ascii 32)) (target-id uint))
  (begin
    (asserts\! (var-get audit-log-enabled) (err u2900))
    (let ((id (+ (var-get audit-log-count) u1)))
      (map-set audit-entries id { action: action, actor: tx-sender, target-id: target-id, block: stacks-block-height })
      (var-set audit-log-count id)
      (ok id))))

;; Import data validation
(define-data-var import-enabled bool true)
(define-data-var import-count uint u0)
(define-map import-records uint { source: (string-ascii 32), items: uint, imported-at: uint, valid: bool })
(define-read-only (get-import-params)
  { enabled: (var-get import-enabled), count: (var-get import-count) })
(define-public (record-import (source (string-ascii 32)) (items uint))
  (begin
    (asserts\! (is-contract-owner) ERR-NOT-AUTHORIZED)
    (asserts\! (var-get import-enabled) (err u3000))
    (let ((id (+ (var-get import-count) u1)))
      (map-set import-records id { source: source, items: items, imported-at: stacks-block-height, valid: true })
      (var-set import-count id)
      (ok id))))

;; Timezone offset management
(define-map tz-offsets principal int)
(define-data-var tz-default int 0)
(define-public (set-tz-offset (offset int))
  (begin
    (asserts! (and (>= offset -43200) (<= offset 50400)) (err u3100))
    (map-set tz-offsets tx-sender offset)
    (ok true)))
(define-read-only (get-tz-offset (who principal))
  (default-to (var-get tz-default) (map-get? tz-offsets who)))
(define-public (set-default-tz (offset int))
  (begin
    (asserts! (is-eq tx-sender contract-caller) (err u3101))
    (var-set tz-default offset)
    (ok true)))

;; API versioning system
(define-map api-versions uint { major: uint, minor: uint, deprecated: bool })
(define-data-var current-api-version uint u1)
(define-public (register-api-version (ver uint) (major uint) (minor uint))
  (begin
    (asserts! (> ver u0) (err u3200))
    (map-set api-versions ver { major: major, minor: minor, deprecated: false })
    (var-set current-api-version ver)
    (ok true)))
(define-public (deprecate-api-version (ver uint))
  (begin
    (match (map-get? api-versions ver)
      entry (begin
        (map-set api-versions ver (merge entry { deprecated: true }))
        (ok true))
      (err u3201))))
(define-read-only (get-api-version (ver uint))
  (map-get? api-versions ver))

;; Cache refresh tracking
(define-map cache-entries uint { key: (string-ascii 64), updated-at: uint, ttl: uint })
(define-data-var cache-counter uint u0)
(define-data-var cache-enabled bool true)
(define-public (add-cache-entry (key (string-ascii 64)) (ttl uint))
  (begin
    (asserts! (var-get cache-enabled) (err u3300))
    (asserts! (> ttl u0) (err u3301))
    (let ((id (+ (var-get cache-counter) u1)))
      (map-set cache-entries id { key: key, updated-at: stacks-block-height, ttl: ttl })
      (var-set cache-counter id)
      (ok id))))
(define-read-only (is-cache-stale (id uint))
  (match (map-get? cache-entries id)
    entry (> (- stacks-block-height (get updated-at entry)) (get ttl entry))
    true))
(define-public (toggle-cache (on bool))
  (begin (var-set cache-enabled on) (ok true)))

;; Webhook delivery tracking
(define-map webhook-endpoints uint { url-hash: (buff 32), active: bool, retries: uint })
(define-map webhook-deliveries uint { endpoint-id: uint, status: uint, attempted-at: uint })
(define-data-var webhook-count uint u0)
(define-data-var delivery-count uint u0)
(define-public (register-webhook (url-hash (buff 32)))
  (let ((id (+ (var-get webhook-count) u1)))
    (map-set webhook-endpoints id { url-hash: url-hash, active: true, retries: u0 })
    (var-set webhook-count id)
    (ok id)))
(define-public (record-delivery (endpoint-id uint) (status uint))
  (let ((did (+ (var-get delivery-count) u1)))
    (asserts! (<= endpoint-id (var-get webhook-count)) (err u3400))
    (map-set webhook-deliveries did { endpoint-id: endpoint-id, status: status, attempted-at: stacks-block-height })
    (var-set delivery-count did)
    (ok did)))
(define-public (deactivate-webhook (id uint))
  (match (map-get? webhook-endpoints id)
    entry (begin (map-set webhook-endpoints id (merge entry { active: false })) (ok true))
    (err u3401)))

;; Health check system
(define-map health-checks uint { service: (string-ascii 32), status: bool, last-check: uint })
(define-data-var health-count uint u0)
(define-data-var health-interval uint u10)
(define-public (register-health-check (service (string-ascii 32)))
  (let ((id (+ (var-get health-count) u1)))
    (map-set health-checks id { service: service, status: true, last-check: stacks-block-height })
    (var-set health-count id)
    (ok id)))
(define-public (update-health-status (id uint) (status bool))
  (match (map-get? health-checks id)
    entry (begin
      (map-set health-checks id (merge entry { status: status, last-check: stacks-block-height }))
      (ok true))
    (err u3500)))
(define-read-only (is-healthy (id uint))
  (match (map-get? health-checks id)
    entry (get status entry)
    false))
(define-public (set-health-interval (blocks uint))
  (begin
    (asserts! (> blocks u0) (err u3501))
    (var-set health-interval blocks)
    (ok true)))

;; cflres tracking
(define-map cflres-log uint { v: uint, at: uint })
(define-data-var cflres-cnt uint u0)
(define-public (log-cflres (val uint))
  (begin (asserts! (> val u0) (err u4100))
    (let ((id (+ (var-get cflres-cnt) u1)))
      (map-set cflres-log id { v: val, at: stacks-block-height })
      (var-set cflres-cnt id) (ok id))))
(define-read-only (get-cflres-entry (id uint))
  (map-get? cflres-log id))

;; rmaloc tracking
(define-map rmaloc-log uint { v: uint, at: uint })
(define-data-var rmaloc-cnt uint u0)
(define-public (log-rmaloc (val uint))
  (begin (asserts! (> val u0) (err u4200))
    (let ((id (+ (var-get rmaloc-cnt) u1)))
      (map-set rmaloc-log id { v: val, at: stacks-block-height })
      (var-set rmaloc-cnt id) (ok id))))
(define-read-only (get-rmaloc-entry (id uint))
  (map-get? rmaloc-log id))

;; insld tracking
(define-map insld-log uint { v: uint, at: uint })
(define-data-var insld-cnt uint u0)
(define-public (log-insld (val uint))
  (begin (asserts! (> val u0) (err u4300))
    (let ((id (+ (var-get insld-cnt) u1)))
      (map-set insld-log id { v: val, at: stacks-block-height })
      (var-set insld-cnt id) (ok id))))
(define-read-only (get-insld-entry (id uint))
  (map-get? insld-log id))

;; prdbnd tracking
(define-map prdbnd-log uint { v: uint, at: uint })
(define-data-var prdbnd-cnt uint u0)
(define-public (log-prdbnd (val uint))
  (begin (asserts! (> val u0) (err u4400))
    (let ((id (+ (var-get prdbnd-cnt) u1)))
      (map-set prdbnd-log id { v: val, at: stacks-block-height })
      (var-set prdbnd-cnt id) (ok id))))
(define-read-only (get-prdbnd-entry (id uint))
  (map-get? prdbnd-log id))

;; brkscd tracking
(define-map brkscd-log uint { v: uint, at: uint })
(define-data-var brkscd-cnt uint u0)
(define-public (log-brkscd (val uint))
  (begin (asserts! (> val u0) (err u4500))
    (let ((id (+ (var-get brkscd-cnt) u1)))
      (map-set brkscd-log id { v: val, at: stacks-block-height })
      (var-set brkscd-cnt id) (ok id))))
(define-read-only (get-brkscd-entry (id uint))
  (map-get? brkscd-log id))

;; exmplc tracking
(define-map exmplc-log uint { v: uint, at: uint })
(define-data-var exmplc-cnt uint u0)
(define-public (log-exmplc (val uint))
  (begin (asserts! (> val u0) (err u4600))
    (let ((id (+ (var-get exmplc-cnt) u1)))
      (map-set exmplc-log id { v: val, at: stacks-block-height })
      (var-set exmplc-cnt id) (ok id))))
(define-read-only (get-exmplc-entry (id uint))
  (map-get? exmplc-log id))

;; labbk tracking
(define-map labbk-log uint { v: uint, at: uint })
(define-data-var labbk-cnt uint u0)
(define-public (log-labbk (val uint))
  (begin (asserts! (> val u0) (err u4700))
    (let ((id (+ (var-get labbk-cnt) u1)))
      (map-set labbk-log id { v: val, at: stacks-block-height })
      (var-set labbk-cnt id) (ok id))))
(define-read-only (get-labbk-entry (id uint))
  (map-get? labbk-log id))

;; submgr tracking
(define-map submgr-log uint { v: uint, at: uint })
(define-data-var submgr-cnt uint u0)
(define-public (log-submgr (val uint))
  (begin (asserts! (> val u0) (err u4800))
    (let ((id (+ (var-get submgr-cnt) u1)))
      (map-set submgr-log id { v: val, at: stacks-block-height })
      (var-set submgr-cnt id) (ok id))))
(define-read-only (get-submgr-entry (id uint))
  (map-get? submgr-log id))

;; attsyn tracking
(define-map attsyn-log uint { v: uint, at: uint })
(define-data-var attsyn-cnt uint u0)
(define-public (log-attsyn (val uint))
  (begin (asserts! (> val u0) (err u4900))
    (let ((id (+ (var-get attsyn-cnt) u1)))
      (map-set attsyn-log id { v: val, at: stacks-block-height })
      (var-set attsyn-cnt id) (ok id))))
(define-read-only (get-attsyn-entry (id uint))
  (map-get? attsyn-log id))

;; grdexp tracking
(define-map grdexp-log uint { v: uint, at: uint })
(define-data-var grdexp-cnt uint u0)
(define-public (log-grdexp (val uint))
  (begin (asserts! (> val u0) (err u5000))
    (let ((id (+ (var-get grdexp-cnt) u1)))
      (map-set grdexp-log id { v: val, at: stacks-block-height })
      (var-set grdexp-cnt id) (ok id))))
(define-read-only (get-grdexp-entry (id uint))
  (map-get? grdexp-log id))

;; curmap tracking
(define-map curmap-log uint { v: uint, at: uint })
(define-data-var curmap-cnt uint u0)
(define-public (log-curmap (val uint))
  (begin (asserts! (> val u0) (err u5100))
    (let ((id (+ (var-get curmap-cnt) u1)))
      (map-set curmap-log id { v: val, at: stacks-block-height })
      (var-set curmap-cnt id) (ok id))))
(define-read-only (get-curmap-entry (id uint))
  (map-get? curmap-log id))

;; prqchn tracking
(define-map prqchn-log uint { v: uint, at: uint })
(define-data-var prqchn-cnt uint u0)
(define-public (log-prqchn (val uint))
  (begin (asserts! (> val u0) (err u5200))
    (let ((id (+ (var-get prqchn-cnt) u1)))
      (map-set prqchn-log id { v: val, at: stacks-block-height })
      (var-set prqchn-cnt id) (ok id))))
(define-read-only (get-prqchn-entry (id uint))
  (map-get? prqchn-log id))

;; enrcap tracking
(define-map enrcap-log uint { v: uint, at: uint })
(define-data-var enrcap-cnt uint u0)
(define-public (log-enrcap (val uint))
  (begin (asserts! (> val u0) (err u5300))
    (let ((id (+ (var-get enrcap-cnt) u1)))
      (map-set enrcap-log id { v: val, at: stacks-block-height })
      (var-set enrcap-cnt id) (ok id))))
(define-read-only (get-enrcap-entry (id uint))
  (map-get? enrcap-log id))

;; wltpri tracking
(define-map wltpri-log uint { v: uint, at: uint })
(define-data-var wltpri-cnt uint u0)
(define-public (log-wltpri (val uint))
  (begin (asserts! (> val u0) (err u5400))
    (let ((id (+ (var-get wltpri-cnt) u1)))
      (map-set wltpri-log id { v: val, at: stacks-block-height })
      (var-set wltpri-cnt id) (ok id))))
(define-read-only (get-wltpri-entry (id uint))
  (map-get? wltpri-log id))

;; fdbklp tracking
(define-map fdbklp-log uint { v: uint, at: uint })
(define-data-var fdbklp-cnt uint u0)
(define-public (log-fdbklp (val uint))
  (begin (asserts! (> val u0) (err u5500))
    (let ((id (+ (var-get fdbklp-cnt) u1)))
      (map-set fdbklp-log id { v: val, at: stacks-block-height })
      (var-set fdbklp-cnt id) (ok id))))
(define-read-only (get-fdbklp-entry (id uint))
  (map-get? fdbklp-log id))

;; rstrk tracking
(define-map rstrk-log uint { v: uint, at: uint })
(define-data-var rstrk-cnt uint u0)
(define-public (log-rstrk (val uint))
  (begin (asserts! (> val u0) (err u5600))
    (let ((id (+ (var-get rstrk-cnt) u1)))
      (map-set rstrk-log id { v: val, at: stacks-block-height })
      (var-set rstrk-cnt id) (ok id))))
(define-read-only (get-rstrk-entry (id uint))
  (map-get? rstrk-log id))

;; cmprpt tracking
(define-map cmprpt-log uint { v: uint, at: uint })
(define-data-var cmprpt-cnt uint u0)
(define-public (log-cmprpt (val uint))
  (begin (asserts! (> val u0) (err u5700))
    (let ((id (+ (var-get cmprpt-cnt) u1)))
      (map-set cmprpt-log id { v: val, at: stacks-block-height })
      (var-set cmprpt-cnt id) (ok id))))
(define-read-only (get-cmprpt-entry (id uint))
  (map-get? cmprpt-log id))

;; acmcal tracking
(define-map acmcal-log uint { v: uint, at: uint })
(define-data-var acmcal-cnt uint u0)
(define-public (log-acmcal (val uint))
  (begin (asserts! (> val u0) (err u5800))
    (let ((id (+ (var-get acmcal-cnt) u1)))
      (map-set acmcal-log id { v: val, at: stacks-block-height })
      (var-set acmcal-cnt id) (ok id))))
(define-read-only (get-acmcal-entry (id uint))
  (map-get? acmcal-log id))
