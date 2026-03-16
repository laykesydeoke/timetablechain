# Governance

TimeTableChain includes on-chain governance parameter management.

## Parameters

- **Max Slots Per Teacher**: Maximum slots a teacher can hold
- **Min Time Block**: Minimum valid time block value
- **Governance Actions**: Audit counter for changes

## Admin Controls

```clarity
(set-max-slots-per-teacher u100)
(get-governance-params)
```
