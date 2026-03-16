# Audit Guide

## On-Chain Records

All critical events are recorded on Stacks blockchain:

1. **Slot Creation**: Token minted with full metadata
2. **Transfers**: Ownership changes with block timestamps
3. **Deactivations**: Slot status changes recorded
4. **Snapshots**: Point-in-time protocol state

## Reading Audit Data

```clarity
(get-slot-details u1)           ;; Full slot record
(get-protocol-snapshot u0)     ;; Historical snapshot
(get-protocol-report)           ;; Current state
```
