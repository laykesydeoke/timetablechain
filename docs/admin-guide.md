# Admin Guide

## Owner Responsibilities

1. Authorize qualified teachers
2. Set governance parameters
3. Manage emergency pause

## Governance Management

Update slot limits:
```clarity
(set-max-slots-per-teacher u150)
```

## Emergency Controls

```clarity
(toggle-pause)  ;; Enable/disable emergency pause
```

## Teacher Authorization

```clarity
(authorize-teacher 'SP...)
(revoke-teacher 'SP...)
```
