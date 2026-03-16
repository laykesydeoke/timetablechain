# Slot Analytics

TimeTableChain tracks protocol usage with on-chain analytics.

## Available Metrics

```clarity
(get-slot-analytics)  ;; Returns all analytics
(get-teacher-count)   ;; Returns total token count
```

## Analytics Fields

- `total-slots`: Total teaching slots created
- `total-transfers`: Number of slot transfers
- `total-deactivations`: Deactivated slots count
- `last-token-id`: Latest token ID minted
