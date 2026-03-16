# Security Controls

## Emergency Pause

Immediately halt all marketplace operations:

```clarity
(emergency-pause)
```

## Resuming Operations

After investigating and resolving:

```clarity
(emergency-resume)
```

## Access Control

Only the contract owner can trigger emergency actions.
All other principals receive ERR-NOT-AUTHORIZED (u401).
