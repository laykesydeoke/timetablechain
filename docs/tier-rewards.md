# Tier Rewards

Teachers earn tier upgrades based on slot count:

| Tier | Slots Required | Bonus |
|------|---------------|-------|
| Bronze | 0-4 | 0 bps |
| Silver | 5-9 | 50 bps |
| Gold | 10+ | 100 bps |

## Querying Tier

```clarity
(get-teacher-tier 'SP...)
(get-teacher-tier-name 'SP...)
(get-teacher-bonus-bps 'SP...)
```
