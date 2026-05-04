import { keccak256, toBytes } from "viem";

// Convert hex string to byte array (for circuit input)
export const hexToBytes = (hex: `0x${string}`): number[] => {
  const bytes: number[] = [];
  for (let i = 2; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
};

// Compute keccak256 hash of a string
export const computeGuessHash = (guess: string): `0x${string}` => {
  return keccak256(toBytes(guess));
};

// Compute double keccak256 hash (for storing answer on-chain)
export const computeAnswerDoubleHash = (guess: string): `0x${string}` => {
  const firstHash = keccak256(toBytes(guess));
  const secondHash = keccak256(firstHash);
  return secondHash;
};

// Convert address to Field format for circuit (decimal string)
export const addressToField = (address: `0x${string}`): string => {
  return BigInt(address).toString();
};

// Format address for display
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format time remaining
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};
