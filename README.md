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
