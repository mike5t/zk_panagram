import { useState, useCallback, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { getConfig, PANAGRAM_ABI } from "../config/contracts";

// Game letters stored in localStorage by round
const GAME_LETTERS_KEY = "panagram_game_letters";

interface GameLetters {
  round: number;
  letters: string[];
  centerLetter: string;
}

const getStoredGameLetters = (): GameLetters | null => {
  try {
    const stored = localStorage.getItem(GAME_LETTERS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const storeGameLetters = (round: number, letters: string[], centerLetter: string) => {
  const data: GameLetters = { round, letters, centerLetter };
  localStorage.setItem(GAME_LETTERS_KEY, JSON.stringify(data));
};

export const usePanagramState = () => {
  const { address } = useAccount();
  const config = getConfig();
  const [gameLetters, setGameLetters] = useState<GameLetters | null>(null);

  const { data: currentRound } = useReadContract({
    address: config.PANAGRAM_ADDRESS,
    abi: PANAGRAM_ABI,
    functionName: "s_currentRound",
  });

  // Load game letters from localStorage when round changes
  useEffect(() => {
    const stored = getStoredGameLetters();
    if (stored && stored.round === Number(currentRound)) {
      setGameLetters(stored);
    } else {
      setGameLetters(null);
    }
  }, [currentRound]);

  const { data: currentAnswer } = useReadContract({
    address: config.PANAGRAM_ADDRESS,
    abi: PANAGRAM_ABI,
    functionName: "s_answer",
  });

  const { data: currentWinner } = useReadContract({
    address: config.PANAGRAM_ADDRESS,
    abi: PANAGRAM_ABI,
    functionName: "s_currentRoundWinner",
  });

  const { data: roundStartTime } = useReadContract({
    address: config.PANAGRAM_ADDRESS,
    abi: PANAGRAM_ABI,
    functionName: "s_roundStartTime",
  });

  const { data: minDuration } = useReadContract({
    address: config.PANAGRAM_ADDRESS,
    abi: PANAGRAM_ABI,
    functionName: "MIN_DURATION",
  });

  const { data: owner, isLoading: isOwnerLoading, error: ownerError } = useReadContract({
    address: config.PANAGRAM_ADDRESS,
    abi: PANAGRAM_ABI,
    functionName: "owner",
  });

  // Debug: log contract read errors
  if (ownerError) {
    console.error("Error reading owner from contract:", ownerError);
    console.log("Contract address:", config.PANAGRAM_ADDRESS);
  }

  const { data: userLastCorrectRound } = useReadContract({
    address: config.PANAGRAM_ADDRESS,
    abi: PANAGRAM_ABI,
    functionName: "s_lastCorrectGuessRound",
    args: [address || "0x0000000000000000000000000000000000000000"],
  });

  const { data: userFirstGuessBalance } = useReadContract({
    address: config.PANAGRAM_ADDRESS,
    abi: PANAGRAM_ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000", 0n],
  });

  const { data: userRunnerUpBalance } = useReadContract({
    address: config.PANAGRAM_ADDRESS,
    abi: PANAGRAM_ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000", 1n],
  });

  const isOwner = Boolean(address && owner && address.toLowerCase() === (owner as string).toLowerCase());
  
  // Debug logging for owner check
  console.log("Owner check - Address:", address, "Owner:", owner, "Loading:", isOwnerLoading, "Match:", isOwner);
  
  const hasAlreadyGuessed = Boolean(currentRound && Number(currentRound) > 0 && userLastCorrectRound === currentRound);

  return {
    currentRound: currentRound || 0n,
    currentAnswer,
    currentWinner,
    roundStartTime: roundStartTime || 0n,
    minDuration: minDuration || 0n,
    owner,
    isOwner,
    isOwnerLoading,
    userLastCorrectRound: userLastCorrectRound || 0n,
    userFirstGuessBalance: userFirstGuessBalance || 0n,
    userRunnerUpBalance: userRunnerUpBalance || 0n,
    hasAlreadyGuessed,
    availableLetters: gameLetters?.letters || [],
    centerLetter: gameLetters?.centerLetter || "",
  };
};

export const useMakeGuess = () => {
  const { writeContractAsync } = useWriteContract();
  const config = getConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeGuess = useCallback(
    async (proof: `0x${string}`) => {
      setIsLoading(true);
      setError(null);
      try {
        const hash = await writeContractAsync({
          address: config.PANAGRAM_ADDRESS,
          abi: PANAGRAM_ABI,
          functionName: "makeGuess",
          args: [proof],
        });
        return hash;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [writeContractAsync]
  );

  return { makeGuess, isLoading, error };
};

export const useNewRound = () => {
  const { writeContractAsync } = useWriteContract();
  const config = getConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newRound = useCallback(
    async (answerHash: `0x${string}`) => {
      setIsLoading(true);
      setError(null);
      try {
        const hash = await writeContractAsync({
          address: config.PANAGRAM_ADDRESS,
          abi: PANAGRAM_ABI,
          functionName: "newRound",
          args: [answerHash],
        });
        return hash;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [writeContractAsync]
  );

  return { newRound, isLoading, error };
};
