# ZK Panagram

A zero-knowledge word game on the blockchain. Players guess a hidden word using a honeycomb of letters — their answer is verified cryptographically without ever being revealed on-chain.

Inspired by the NYT Spelling Bee, but with ZK proofs instead of a server checking your answer.

---

## How It Works

### The Game

- Each round, the admin picks a secret answer word and a set of 6–7 letters to display in a honeycomb grid
- One letter is designated the **center letter** — every valid guess must contain it
- Players type or click letters to form words and submit them
- The **first** correct guesser wins a Legendary NFT (token ID `0`)
- All subsequent correct guessers win a Rare Runner-Up NFT (token ID `1`)
- A new round can only start after the minimum 3-hour duration has passed and the current round has a winner

### The Zero-Knowledge Part

The key problem: how do you prove you know the answer without telling the blockchain what it is?

**On-chain storage:** The contract stores `keccak256(keccak256(answer))` — a double hash. No one can reverse this to find the answer.

**Proof generation (client-side):**
1. Player types their guess
2. Frontend computes `keccak256(guess)` locally
3. The Noir circuit proves: *"I know a value `H` such that `keccak256(H) == stored_double_hash`"* — where `H = keccak256(guess)` is the private input
4. The player's Ethereum address is bound into the proof to prevent someone else reusing it

**On-chain verification:**
- The contract calls the `HonkVerifier` with the proof and public inputs
- If valid, the player is recorded as correct and receives their NFT
- The actual answer word never touches the blockchain

```
Player's browser                    Blockchain
─────────────────                   ──────────
guess = "sway"                      stores: keccak256(keccak256("sway"))
H = keccak256("sway")  ──proof──►  verify: keccak256(H) == stored_hash ?
address = 0xABC...                  if yes → mint NFT to 0xABC
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| ZK Circuit | [Noir](https://noir-lang.org/) + UltraHonk proving system |
| Smart Contracts | Solidity 0.8.24, [Foundry](https://book.getfoundry.sh/) |
| Frontend | React + TypeScript + Vite |
| Web3 | [wagmi](https://wagmi.sh/) + [viem](https://viem.sh/) |
| Client-side proving | `@noir-lang/noir_js` + `@aztec/bb.js` |
| Contract libs | OpenZeppelin (ERC1155, Ownable), forge-std |

---

## Project Structure

```
zk_panagram/
├── circuits/               # Noir ZK circuit
│   ├── src/main.nr         # Circuit logic
│   ├── Nargo.toml          # Noir package config
│   └── Prover.toml         # Example inputs for local proving
│
├── contracts/              # Solidity smart contracts (Foundry)
│   ├── src/
│   │   ├── Panagram.sol    # Main game contract (ERC1155)
│   │   └── Verifier.sol    # Auto-generated UltraHonk verifier
│   ├── script/
│   │   ├── Deploy.s.sol    # Deployment script
│   │   └── TestVerify.s.sol
│   ├── test/
│   │   └── Panagram.t.sol  # Contract tests
│   └── foundry.toml
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # GameBoard, AdminPanel, WalletConnect
│   │   ├── hooks/          # usePanagram, useProofGeneration
│   │   ├── config/         # wagmi config, contract ABI
│   │   └── utils/crypto.ts # keccak hashing helpers
│   └── public/
│       └── zk_panagram.json  # Compiled circuit artifact (served to browser)
│
└── deploy.sh               # Local dev deployment script
```

---

## Local Development

### Prerequisites

- [Noir / Nargo](https://noir-lang.org/docs/getting_started/installation/) — ZK circuit compiler
- [Foundry](https://book.getfoundry.sh/getting_started/installation) — Solidity toolchain
- [Node.js](https://nodejs.org/) 18+
- [Anvil](https://book.getfoundry.sh/anvil/) — local EVM (comes with Foundry)

### 1. Compile the circuit

```bash
cd circuits
nargo compile
```

This produces `circuits/target/zk_panagram.json`. Copy it to the frontend public folder:

```bash
cp circuits/target/zk_panagram.json frontend/public/
```

### 2. Generate the Solidity verifier

```bash
bb write_vk -b circuits/target/zk_panagram.json -o circuits/target/vk
bb contract -k circuits/target/vk -o contracts/src/Verifier.sol
```

### 3. Start Anvil and deploy contracts

In one terminal:
```bash
anvil
```

In another (use any Anvil test key):
```bash
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476caf365f3137efb118b80c687
bash deploy.sh
```

This deploys `HonkVerifier` and `Panagram`, then writes the addresses to `frontend/.env.local`.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Playing the Game

### As Admin

1. Connect the wallet that deployed the contract (the owner)
2. The **Admin Panel** appears at the top
3. Enter a secret answer word (min 4 letters)
4. The panel auto-suggests letters; pick a center letter
5. Click **Start New Round** — this hashes the answer and sends it on-chain

### As a Player

1. Connect any wallet
2. You see a honeycomb of 6–7 letters with one highlighted center letter
3. Click letters or type on your keyboard to form words
4. Hit **Enter** to submit
5. The browser generates a ZK proof (~5–15 seconds), then submits it to the contract
6. If correct: an NFT is minted to your wallet

---

## Smart Contract Overview

### `Panagram.sol`

Extends `ERC1155` and `Ownable`.

| Function | Access | Description |
|---|---|---|
| `newRound(bytes32 _answer)` | Owner | Starts a round with a double-hashed answer |
| `makeGuess(bytes proof)` | Anyone | Submits a ZK proof; mints NFT on success |
| `setVerifier(IVerifier)` | Owner | Upgrades the verifier contract |

**NFT Token IDs:**
- `0` — Winner (first correct guesser per round) — *Legendary*
- `1` — Runner-Up (all subsequent correct guessers) — *Rare*

### `Verifier.sol`

Auto-generated by Barretenberg (`bb contract`). Exposes a single `verify(bytes proof, bytes32[] publicInputs)` function used by `Panagram.sol`.

---

## Circuit Overview (`circuits/src/main.nr`)

```
fn main(
    guess_hash_bytes: [u8; 32],        // PRIVATE: keccak256(guess)
    answer_double_hash: pub [u8; 32],  // PUBLIC:  keccak256(keccak256(answer))
    address: pub Field                  // PUBLIC:  player's address
)
```

The circuit:
1. Computes `keccak256(guess_hash_bytes)`
2. Asserts it equals `answer_double_hash` byte-by-byte
3. Asserts `address != 0` (binds proof to a specific player)

The private input never leaves the browser. Only the proof and public inputs are sent to the contract.

---

## Security Notes

- The answer is protected by double-hashing: even if someone sees `keccak256(answer)` in transit, they cannot reverse it to the plaintext
- Proofs are bound to `msg.sender` — a valid proof cannot be replayed by a different address
- Each address can only win once per round (`s_lastCorrectGuessRound` mapping)
- Never commit `.env.local` or private keys — use environment variables for deployment
