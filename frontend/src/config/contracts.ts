// Contract configuration and ABIs
export const PANAGRAM_ABI = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_verifier",
        type: "address",
        internalType: "contract IVerifier",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "MIN_DURATION",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
      {
        name: "id",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "makeGuess",
    inputs: [
      {
        name: "proof",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "newRound",
    inputs: [
      {
        name: "_answer",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "s_answer",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "s_currentRound",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "s_currentRoundWinner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "s_lastCorrectGuessRound",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "s_roundStartTime",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "s_verifier",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IVerifier",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setVerifier",
    inputs: [
      {
        name: "_verifier",
        type: "address",
        internalType: "contract IVerifier",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "Panagram_NewRoundStarted",
    inputs: [
      {
        name: "answer",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
      {
        name: "roundStartTime",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "round",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Panagram__WinnerCrowned",
    inputs: [
      {
        name: "winner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "round",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Panagram__RunnerUp",
    inputs: [
      {
        name: "runnerUp",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "round",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "Panagram__InvalidProof",
    inputs: [],
  },
  {
    type: "error",
    name: "Panagram__AlreadyGuessedCorrectly",
    inputs: [
      {
        name: "round",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "Panagram__FirstPanagramNotSet",
    inputs: [],
  },
  {
    type: "error",
    name: "Panagram_MinTimeNotPassed",
    inputs: [
      {
        name: "minDuration",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "timePassed",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "Panagram__NoRoundWinner",
    inputs: [],
  },
] as const;

// Environment configuration
export const getConfig = () => ({
  // Deployed contract address for local Anvil
  PANAGRAM_ADDRESS: (import.meta.env.VITE_PANAGRAM_ADDRESS ||
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") as `0x${string}`,
  RPC_URL: import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545",
  CHAIN_ID: parseInt(import.meta.env.VITE_CHAIN_ID || "31337"),
  CIRCUIT_JSON_PATH: "/zk_panagram.json",
  PROVING_KEY_PATH: "/zk_panagram.json",
});

export const TOKEN_IDS = {
  FIRST_GUESSER: 0n,
  RUNNER_UP: 1n,
};
