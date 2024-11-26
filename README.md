# TimeChain Marketplace

A decentralized application built on the Stacks blockchain for managing and trading teaching slots. Teachers can tokenize, exchange, and manage their teaching schedules transparently.

## Features

- **Tokenized Teaching Slots** - Convert teaching schedules into blockchain tokens
- **Secure Transfers** - Smart contract powered slot exchanges
- **Transparent History** - Immutable record of all exchanges on-chain
- **Quick Substitution** - Real-time marketplace for schedule coverage

## Prerequisites

- Node.js (v14+)
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
- [ ] Mobile app
- [ ] Cross-school trading
- [ ] Analytics dashboard

## Team

Lead Developer - Olalekan Akande

## Acknowledgments

- Stacks Foundation
