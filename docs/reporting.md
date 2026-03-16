# Reporting

Protocol snapshots provide historical reporting for TimeTableChain.

## Snapshot Functions

```clarity
(take-protocol-snapshot)        ;; Takes a snapshot, returns ID
(get-protocol-snapshot u0)      ;; Read snapshot by ID
(get-protocol-report)           ;; Current protocol state
```

## Report Fields

- `total-slots`: All-time slots created
- `total-transfers`: All-time transfer count
- `snapshot-count`: Number of snapshots taken
- `report-block`: Current block height
