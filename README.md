# TimeChain Marketplace

A decentralized application built on the Stacks blockchain for managing and trading teaching slots. Teachers can tokenize, exchange, and manage their teaching schedules transparently.

## Features

- **Tokenized Teaching Slots** - Convert teaching schedules into blockchain tokens
- **Secure Transfers** - Smart contract powered slot exchanges
- **Transparent History** - Immutable record of all exchanges on-chain
- **Quick Substitution** - Real-time marketplace for schedule coverage

## Tech Stack

- **Clarity**: Version 4
- **Testing**: Vitest with Clarinet SDK
- **Frontend**: Static HTML/CSS/JS with Stacks.js

## Prerequisites

- Node.js (v18+)
- Clarinet CLI
- Hiro Wallet

## Quick Start

```bash
git clone https://github.com/laykesydeoke/timetablechain.git
cd timetablechain
```

Check contracts:
```bash
clarinet check
```

Run tests:
```bash
clarinet test
```

Start frontend:
```bash
cd frontend && npx serve .
```

## Project Structure

```
timetablechain/
├── contracts/
│   └── timetablechain.clar   # Core teaching slot contract
├── frontend/
│   ├── index.html             # Landing page
│   ├── styles.css             # Stylesheet
│   └── app.js                 # Wallet and slot interaction
├── tests/
│   └── timetablechain_test.ts
├── Clarinet.toml
└── README.md
```

## Smart Contract

The `timetablechain.clar` contract supports:

- `create-teaching-slot` - Create a tokenized time slot
- `transfer` - Transfer slot between teachers
- `get-slot-details` - Query slot info
- `get-teacher-slot-list` - List teacher slots
- `toggle-pause` - Emergency pause

## Roadmap

- [x] Core smart contract
- [x] Frontend landing page
- [x] Clarity 4 migration
- [ ] Mobile app
- [ ] Cross-school trading
- [ ] Analytics dashboard

## Team

Lead Developer - Olalekan Akande

## Acknowledgments

- Stacks Foundation

## Slot Analytics

On-chain analytics tracking for protocol usage:

- Total slots created
- Transfer count
- Deactivation count

```bash
npm run test:analytics
npm run test:teachers
```

## Governance

On-chain parameter management for the protocol:

- **Max Slots Per Teacher**: Configurable slot limits
- **Governance Audit**: All parameter changes logged

```bash
npm run test:governance
npm run test:gov-edge
```

## Reporting

Protocol snapshots for historical analysis and compliance:

- **Protocol Snapshots**: Point-in-time state capture
- **Historical Reports**: Access any snapshot by ID

```bash
npm run test:reporting
npm run test:snapshots
```

## Teacher Tier Rewards

Teachers earn loyalty tiers based on slot creation:

- **Bronze** (0-4 slots): Base rate
- **Silver** (5-9 slots): +50 bps bonus
- **Gold** (10+ slots): +100 bps bonus

```bash
npm run test:tiers
npm run test:tier-levels
```

## Marketplace Analytics

Comprehensive market data tracking:

- **Active Slots**: Currently tradeable teaching slots
- **Market Summary**: Pause state, governance actions, snapshots

```bash
npm run test:market
npm run test:market-coexist
```

## Emergency Controls

Enhanced emergency pause with logging:

- **Emergency Pause**: Immediately halt all operations
- **Pause Logging**: Records block and count of pauses
- **Quick Resume**: Resume after incident resolution

```bash
npm run test:emergency
npm run test:pause-cycle
```

## Performance Tracking

Protocol performance monitoring:

- **Transaction Count**: Total protocol transactions
- **Protocol Uptime**: Blocks since deployment

```bash
npm run test:perf
npm run test:perf-coexist
```

## Access Control

Role-based access for protocol administrators:

- **Admin Roles**: Grant and revoke admin access
- **Access Summary**: View current role state

```bash
npm run test:access
npm run test:access-roles
```

## Slot Validation

Configurable validation rules for teaching slots:

- **Duration Range**: Min/max block duration enforcement
- **Toggle Validation**: Enable/disable validation system

```bash
npm run test:validation
npm run test:validation-rules
```

## Slot Pricing

Configurable pricing for teaching slots:
- Default price
- Per-slot overrides

```bash
npm run test:pricing
```

## profile

profile feature.

```bash
npm run test:profile
```
