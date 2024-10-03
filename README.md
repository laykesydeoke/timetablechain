# TimeChain Marketplace

TimeChain Marketplace is a decentralized application built on the Stacks blockchain that revolutionizes how educational institutions manage and trade teaching slots. It provides a transparent, secure, and efficient platform for teachers to tokenize, exchange, and manage their teaching schedules.

## 🌟 Features

- **Tokenized Teaching Slots**: Convert teaching schedules into tradeable NFTs
- **Smart Contract Trading**: Secure and automated slot exchanges
- **Reputation System**: Track and reward reliable teachers
- **Real-time Substitution Market**: Quick coverage for emergency situations
- **Qualification Verification**: Automated checking of teacher credentials
- **Transparent History**: Immutable record of all exchanges

## 📋 Prerequisites

- Node.js (v14.0.0 or higher)
- Stacks CLI
- Clarity CLI
- Hiro Wallet
- MongoDB (for off-chain data)

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/your-username/timechain-marketplace.git
cd timechain-marketplace
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start local development environment**
```bash
npm run dev
```

5. **Deploy smart contracts**
```bash
npm run deploy:contracts
```

## 🏗️ Project Structure

```
timechain-marketplace/
├── contracts/              # Clarity smart contracts
├── frontend/              # React frontend application
├── backend/               # Express.js API server
├── tests/                 # Test suites
├── scripts/               # Deployment and utility scripts
└── docs/                  # Documentation
```

## 🔧 Smart Contracts

The project includes the following main smart contracts:

- `slot-token.clar`: NFT implementation for teaching slots
- `marketplace.clar`: Trading and exchange logic
- `teacher-registry.clar`: Teacher credentials and reputation
- `reputation-token.clar`: Reputation system implementation

## 🎯 Core Functionalities

### Slot Tokenization
```clarity
(define-public (create-slot-token
    (time-block uint)
    (subject (string-ascii 64))
    (grade uint)
    (room-id uint))
    ;; Contract logic
)
```

### Trading
```clarity
(define-public (create-trade
    (slot-id uint)
    (price uint))
    ;; Contract logic
)
```

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

Run specific tests:
```bash
npm run test:contracts    # Smart contract tests
npm run test:integration  # Integration tests
```

## 📦 Deployment

### Testnet
```bash
npm run deploy:testnet
```

### Mainnet
```bash
npm run deploy:mainnet
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔍 API Documentation

API documentation is available at `/docs/api` after starting the development server.

## 🛣️ Roadmap

- [x] Basic smart contract implementation
- [x] Frontend MVP
- [ ] Mobile application
- [ ] Cross-school trading network
- [ ] AI-powered matching system
- [ ] Advanced analytics dashboard

## 🤝 Support

For support, please join our [Discord community](https://discord.gg/timetablechain) or open an issue in the repository.

## 👥 Team

- Lead Developer - [Olalekan Akande]

## 🙏 Acknowledgments

- Stacks Foundation
- [Other Project] for inspiration
- All our contributors and supporters

## 📊 Project Status

Current Status: **Beta Testing**

![Development Progress](https://img.shields.io/badge/development-75%25-yellowgreen)

## 🔄 Recent Updates

- Added reputation system
- Implemented emergency substitution pool
- Enhanced security measures
- Improved UI/UX

## ⚠️ Known Issues

Please check the [Issues](https://github.com/aoakande/timetablechain/issues) page for current known issues and their status.

---

For more detailed documentation, please visit our [Wiki](https://github.com/aoakande/timetablechain/wiki).