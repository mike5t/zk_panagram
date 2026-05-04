# Panagram ZK Game Frontend

A Vite + React + TypeScript frontend for the Panagram zero-knowledge game, built with wagmi for wallet integration and utilizing Noir for proof generation.

## Features

- 🔗 Wallet connection with MetaMask/Injected providers
- 🎮 Interactive game board for submitting guesses
- 🔐 Zero-knowledge proof generation using Noir circuits
- 👑 Admin panel for round management
- 📊 Real-time game state tracking
- ⏱️ Countdown timer for next round eligibility

## Setup

### Prerequisites

- Node.js 18.19.0+
- npm or yarn
- Wallet with test funds (for testnet play)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Configuration

Edit `.env.local` with your deployment details:

```env
# Deployed Panagram contract address
VITE_PANAGRAM_ADDRESS=0x...

# RPC endpoint
VITE_RPC_URL=http://127.0.0.1:8545

# Chain ID (31337 for local Hardhat, etc.)
VITE_CHAIN_ID=31337
```

### Running the App

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── WalletConnect.tsx
│   ├── GameBoard.tsx
│   ├── AdminPanel.tsx
│   └── *.css
├── config/              # Configuration files
│   ├── contracts.ts     # Contract ABIs and addresses
│   └── wagmi.ts         # Wagmi config
├── hooks/               # React hooks
│   ├── usePanagram.ts   # Contract interaction hooks
│   ├── useProofGeneration.ts
│   └── proofWorker.ts   # Web Worker for proof generation
├── utils/               # Utility functions
│   └── crypto.ts        # Hashing and formatting utilities
├── App.tsx              # Main app component
└── main.tsx
```

## How It Works

### Game Flow

1. **Connect Wallet**: Users connect their Web3 wallet (MetaMask, etc.)
2. **View Round**: See current round number, answer hash, and time remaining
3. **Make Guess**: Enter a text guess
4. **Generate Proof**: Frontend generates a Noir proof locally
5. **Submit**: Proof is submitted to the smart contract
6. **Verify**: Smart contract verifies the proof and mints NFTs

### Proof Generation

- Proof generation runs in a web worker to keep UI responsive
- Uses `@noir-lang/backend_barretenberg` to generate proofs
- Requires the compiled Noir circuit (`zk_panagram.json`)

### Admin Features (Owner Only)

- Start new rounds with answer hashes
- Enforce minimum duration between rounds
- Set new verifier contract

## Customization

### Adding Token Metadata

Update `src/config/contracts.ts` to customize token IDs and metadata:

```typescript
export const TOKEN_IDS = {
  FIRST_GUESSER: 0n,
  RUNNER_UP: 1n,
};
```

### Styling

- Global styles: `src/index.css`
- Component styles: Individual `.css` files
- CSS variables for theming in `:root`

## Dependencies

- **wagmi**: Web3 wallet integration
- **viem**: Low-level Ethereum client
- **@rainbow-me/rainbowkit**: Wallet UI (optional)
- **@noir-lang/backend_barretenberg**: Noir proof generation
- **@noir-lang/noir_js**: Noir circuit compilation
- **ethers**: Web3.js alternative utilities

## Troubleshooting

### Proof Generation Fails

- Ensure `zk_panagram.json` exists in `public/`
- Check browser console for detailed error messages
- Verify `VITE_CIRCUIT_JSON_PATH` in config

### Contract Interaction Fails

- Confirm contract address in `.env.local`
- Check RPC endpoint connectivity
- Ensure wallet is on the correct chain

### Wallet Connection Issues

- Clear browser cache and local storage
- Try a different wallet provider
- Check browser console for errors

## Security Notes

- Never commit `.env.local` with real private keys
- Proof generation happens locally; server never sees user guesses
- Always verify contract addresses before deploying

## License

MIT
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
