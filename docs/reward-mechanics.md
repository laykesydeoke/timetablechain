# Reward Mechanics

## Basis Points (BPS)

1 bps = 0.01%

Tier bonuses apply to yield calculations:
- Bronze: No bonus (0 bps)
- Silver: +0.5% bonus (50 bps)
- Gold: +1% bonus (100 bps)

## Implementation

Tier is determined by `teacher-slot-count` map, updated
each time a teaching slot is created.
