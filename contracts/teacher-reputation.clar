;; teacher-reputation.clar
;; On-chain reputation system for teachers in TimetableChain
;; Students can rate teaching slots after completion, building teacher profiles

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u500))
(define-constant ERR-INVALID-RATING (err u501))
(define-constant ERR-ALREADY-RATED (err u502))
(define-constant ERR-SLOT-NOT-FOUND (err u503))
(define-constant ERR-NOT-STUDENT (err u504))
(define-constant ERR-SLOT-NOT-COMPLETED (err u505))
(define-constant ERR-TEACHER-NOT-FOUND (err u506))
(define-constant ERR-INVALID-INPUT (err u507))
(define-constant ERR-REVIEW-TOO-LONG (err u508))

;; Rating scale: 1-5 stars
(define-constant MIN-RATING u1)
(define-constant MAX-RATING u5)

;; Minimum reviews needed for verified badge
(define-data-var verified-threshold uint u10)

;; Maps
(define-map teacher-ratings
    { teacher: principal }
    {
        total-ratings: uint,
        rating-sum: uint,
        five-star-count: uint,
        one-star-count: uint,
        last-rated-at: uint
    }
)

(define-map slot-reviews
    { slot-id: uint, reviewer: principal }
    {
        rating: uint,
        review-text: (string-utf8 256),
        block-height: uint
    }
)

;; Track which slots have been taught (completed)
(define-map completed-slots
    { slot-id: uint }
    { teacher: principal, completed-at: uint }
)

;; Track student enrollment per slot
(define-map slot-enrollment
    { slot-id: uint, student: principal }
    { enrolled: bool }
)

;; ============================================================
;; Slot Lifecycle Functions (called by admin/system)
;; ============================================================

;; Mark a slot as completed (enables reviews)
(define-public (mark-slot-completed (slot-id uint) (teacher principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        (asserts! (> slot-id u0) ERR-INVALID-INPUT)
        (asserts! (is-standard teacher) ERR-INVALID-INPUT)
        (map-set completed-slots
            { slot-id: slot-id }
            { teacher: teacher, completed-at: stacks-block-height }
        )
        (print { event: "slot-completed", slot-id: slot-id, teacher: teacher })
        (ok true)
    )
)

;; Enroll a student in a slot (enables them to leave a review)
(define-public (enroll-student (slot-id uint) (student principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        (asserts! (> slot-id u0) ERR-INVALID-INPUT)
        (asserts! (is-standard student) ERR-INVALID-INPUT)
        (map-set slot-enrollment
            { slot-id: slot-id, student: student }
            { enrolled: true }
        )
        (print { event: "student-enrolled", slot-id: slot-id, student: student })
        (ok true)
    )
)

;; ============================================================
;; Review Functions
;; ============================================================

;; Submit a review for a completed teaching slot
(define-public (submit-review (slot-id uint) (rating uint) (review-text (string-utf8 256)))
    (let (
        (slot-info (unwrap! (map-get? completed-slots { slot-id: slot-id }) ERR-SLOT-NOT-FOUND))
        (enrollment (unwrap! (map-get? slot-enrollment { slot-id: slot-id, student: tx-sender })
                            ERR-NOT-STUDENT))
        (teacher (get teacher slot-info))
        (current-ratings (default-to
            { total-ratings: u0, rating-sum: u0, five-star-count: u0,
              one-star-count: u0, last-rated-at: u0 }
            (map-get? teacher-ratings { teacher: teacher })))
    )
        ;; Validate inputs
        (asserts! (get enrolled enrollment) ERR-NOT-STUDENT)
        (asserts! (>= rating MIN-RATING) ERR-INVALID-RATING)
        (asserts! (<= rating MAX-RATING) ERR-INVALID-RATING)
        (asserts! (> (len review-text) u0) ERR-REVIEW-TOO-LONG)
        ;; Check not already reviewed
        (asserts! (is-none (map-get? slot-reviews { slot-id: slot-id, reviewer: tx-sender }))
                 ERR-ALREADY-RATED)

        ;; Store the review
        (map-set slot-reviews
            { slot-id: slot-id, reviewer: tx-sender }
            { rating: rating, review-text: review-text, block-height: stacks-block-height }
        )

        ;; Update teacher aggregate ratings
        (map-set teacher-ratings
            { teacher: teacher }
            {
                total-ratings: (+ (get total-ratings current-ratings) u1),
                rating-sum: (+ (get rating-sum current-ratings) rating),
                five-star-count: (if (is-eq rating u5)
                    (+ (get five-star-count current-ratings) u1)
                    (get five-star-count current-ratings)),
                one-star-count: (if (is-eq rating u1)
                    (+ (get one-star-count current-ratings) u1)
                    (get one-star-count current-ratings)),
                last-rated-at: stacks-block-height
            }
        )

        (print { event: "review-submitted", slot-id: slot-id, teacher: teacher,
                 reviewer: tx-sender, rating: rating })
        (ok true)
    )
)

;; ============================================================
;; Admin Functions
;; ============================================================

;; Set the number of reviews needed for verified badge
(define-public (set-verified-threshold (threshold uint))
    (begin
        (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
        (asserts! (> threshold u0) ERR-INVALID-INPUT)
        (var-set verified-threshold threshold)
        (ok true)
    )
)

;; ============================================================
;; Read-Only Functions
;; ============================================================

;; Get teacher's aggregate rating data
(define-read-only (get-teacher-rating (teacher principal))
    (default-to
        { total-ratings: u0, rating-sum: u0, five-star-count: u0,
          one-star-count: u0, last-rated-at: u0 }
        (map-get? teacher-ratings { teacher: teacher }))
)

;; Get teacher's average rating (scaled to 100 for precision, e.g. 450 = 4.50)
(define-read-only (get-average-rating (teacher principal))
    (let (
        (ratings (get-teacher-rating teacher))
    )
        (if (> (get total-ratings ratings) u0)
            (/ (* (get rating-sum ratings) u100) (get total-ratings ratings))
            u0)
    )
)

;; Check if teacher has verified badge (enough reviews)
(define-read-only (is-verified-teacher (teacher principal))
    (let (
        (ratings (get-teacher-rating teacher))
    )
        (>= (get total-ratings ratings) (var-get verified-threshold))
    )
)

;; Get a specific review
(define-read-only (get-review (slot-id uint) (reviewer principal))
    (map-get? slot-reviews { slot-id: slot-id, reviewer: reviewer })
)

;; Check if a student has already reviewed a slot
(define-read-only (has-reviewed (slot-id uint) (reviewer principal))
    (is-some (map-get? slot-reviews { slot-id: slot-id, reviewer: reviewer }))
)

;; Check if a slot has been completed
(define-read-only (is-slot-completed (slot-id uint))
    (is-some (map-get? completed-slots { slot-id: slot-id }))
)

;; Check if a student is enrolled in a slot
(define-read-only (is-enrolled (slot-id uint) (student principal))
    (match (map-get? slot-enrollment { slot-id: slot-id, student: student })
        enrollment (get enrolled enrollment)
        false)
)

;; Get the verified threshold setting
(define-read-only (get-verified-threshold)
    (var-get verified-threshold)
)

;; Get teacher reputation summary
(define-read-only (get-teacher-profile (teacher principal))
    (let (
        (ratings (get-teacher-rating teacher))
        (avg (get-average-rating teacher))
        (verified (is-verified-teacher teacher))
    )
        {
            average-rating: avg,
            total-reviews: (get total-ratings ratings),
            five-star-count: (get five-star-count ratings),
            one-star-count: (get one-star-count ratings),
            is-verified: verified
        }
    )
)
