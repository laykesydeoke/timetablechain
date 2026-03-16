# Emergency Pause

Enhanced emergency controls with full audit logging.

## Functions

```clarity
(emergency-pause)   ;; Pause all operations
(emergency-resume)  ;; Resume operations
(get-pause-state)  ;; Read current state
```

## State Fields

- `is-paused`: Current pause status
- `pause-count`: Total historical pauses
- `last-pause-block`: Block of last pause
