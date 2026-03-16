# Teacher Management

## Authorization System

The contract owner authorizes teachers before they can create slots.

## Functions

```clarity
;; Authorize teacher
(authorize-teacher 'SP...)

;; Revoke teacher
(revoke-teacher 'SP...)

;; Check authorization
(is-teacher-authorized 'SP...)
```

## Security

Only the contract owner can authorize or revoke teachers.
Non-owners receive ERR-NOT-AUTHORIZED (u401).
