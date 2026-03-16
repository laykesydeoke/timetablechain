# Compliance Guide

## Data Retention

All slot data is permanently stored on Stacks blockchain.

## Reporting Frequency

Take snapshots at regular intervals:

```clarity
(take-protocol-snapshot)  ;; Callable by any user
```

## Audit Trail

- Block heights recorded for all events
- Immutable token records
- Owner changes tracked
