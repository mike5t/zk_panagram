import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { usePanagramState, useMakeGuess } from "../hooks/usePanagram";
import { useProofGeneration } from "../hooks/useProofGeneration";
import { formatTime } from "../utils/crypto";
import "./GameBoard.css";

// Shuffle letters for display
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface LetterTileProps {
  letter: string;
  isCenter?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const LetterTile = ({ letter, isCenter, onClick, disabled }: LetterTileProps) => (
  <button
    className={`letter-tile ${isCenter ? "center" : ""}`}
    onClick={onClick}
    disabled={disabled}
    type="button"
  >
    {letter}
  </button>
);

export const GameBoard = () => {
  const { address, isConnected } = useAccount();
  const {
    currentRound,
    currentAnswer,
    currentWinner,
    roundStartTime,
    minDuration,
    hasAlreadyGuessed,
    userFirstGuessBalance,
    userRunnerUpBalance,
    availableLetters,
    centerLetter,
    owner,
    isOwner,
    isOwnerLoading,
  } = usePanagramState();
  const { makeGuess, isLoading: isSubmitting } = useMakeGuess();
  const { generateProof, isGenerating } = useProofGeneration();

  const [currentGuess, setCurrentGuess] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");
  const [foundWords, setFoundWords] = useState<string[]>([]);

  // Shuffle outer letters but keep them consistent during the round
  const shuffledLetters = useMemo(() => {
    if (!availableLetters || availableLetters.length === 0) return [];
    return shuffleArray(availableLetters.filter(l => l !== centerLetter));
  }, [availableLetters, centerLetter, currentRound]);

  // Check if a round has actually started
  const hasRoundStarted = currentRound && Number(currentRound) > 0;
  const hasAnswer = currentAnswer && currentAnswer !== "0x0000000000000000000000000000000000000000000000000000000000000000";

  // Calculate time remaining until next round
  useEffect(() => {
    const interval = setInterval(() => {
      if (roundStartTime && minDuration && hasRoundStarted) {
        const nextRoundTime = Number(roundStartTime) + Number(minDuration);
        const now = Math.floor(Date.now() / 1000);
        const remaining = Math.max(0, nextRoundTime - now);
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [roundStartTime, minDuration, hasRoundStarted]);

  // Add letter to current guess
  const addLetter = (letter: string) => {
    setCurrentGuess(prev => prev + letter.toLowerCase());
  };

  // Remove last letter
  const deleteLetter = () => {
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  // Clear current guess
  const clearGuess = () => {
    setCurrentGuess("");
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasRoundStarted || !hasAnswer || isSubmitting || isGenerating) return;
      
      const key = e.key.toLowerCase();
      
      if (key === "backspace") {
        e.preventDefault();
        deleteLetter();
      } else if (key === "enter") {
        e.preventDefault();
        handleSubmitGuess();
      } else if (key === "escape") {
        e.preventDefault();
        clearGuess();
      } else if (/^[a-z]$/.test(key)) {
        // Allow any letter to be typed
        e.preventDefault();
        addLetter(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [availableLetters, centerLetter, hasRoundStarted, hasAnswer, isSubmitting, isGenerating, currentGuess]);

  const handleSubmitGuess = async () => {
    if (!address || !currentAnswer || isSubmitting || isGenerating || !currentGuess) return;
    
    // Minimum word length
    if (currentGuess.length < 4) {
      setStatusMessage("Word must be at least 4 letters!");
      setStatusType("error");
      setTimeout(() => setStatusMessage(""), 3000);
      return;
    }

    setStatusMessage("Generating ZK proof...");
    setStatusType("info");

    try {
      const proofResult = await generateProof(currentGuess, currentAnswer, address);
      setStatusMessage("Submitting proof to blockchain...");

      await makeGuess(proofResult.proof);
      setFoundWords(prev => [...prev, currentGuess.toUpperCase()]);
      setCurrentGuess("");
      setStatusMessage("🎉 Correct! You won an NFT!");
      setStatusType("success");
      setTimeout(() => setStatusMessage(""), 5000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      if (errorMsg.includes("InvalidProof")) {
        setStatusMessage("❌ Wrong word! Try again.");
      } else if (errorMsg.includes("AlreadyGuessed")) {
        setStatusMessage("You've already won this round!");
      } else {
        setStatusMessage(`Error: ${errorMsg}`);
      }
      setStatusType("error");
      setCurrentGuess("");
    }
  };

  if (!isConnected) {
    return (
      <div className="game-board">
        <div className="connect-prompt">
          <div className="connect-icon">🔐</div>
          <h2>Connect Your Wallet</h2>
          <p>Connect your wallet to start playing the ZK Panagram game!</p>
        </div>
      </div>
    );
  }

  if (!hasRoundStarted || !hasAnswer) {
    return (
      <div className="game-board">
        <div className="waiting-screen">
          <div className="waiting-icon">⏳</div>
          <h2>Waiting for Game</h2>
          <p>No active round. Wait for the admin to start a new game!</p>
          
          {/* Show admin info */}
          <div className="admin-info-box">
            <h4>Contract Info</h4>
            <p><strong>Owner:</strong> {isOwnerLoading ? "Loading..." : owner ? `${String(owner).slice(0, 6)}...${String(owner).slice(-4)}` : "Unknown"}</p>
            <p><strong>Your Address:</strong> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</p>
            {isOwnerLoading ? (
              <p className="owner-status info">⏳ Checking admin status...</p>
            ) : isOwner ? (
              <p className="owner-status success">✅ You are the admin! Use the Admin Panel above to start a game.</p>
            ) : (
              <p className="owner-status info">ℹ️ You are not the admin. Wait for a game to start.</p>
            )}
          </div>
          
          <div className="user-nfts">
            <h3>Your NFT Collection</h3>
            <div className="nft-stats">
              <div className="nft-stat">
                <span className="nft-count">{Number(userFirstGuessBalance)}</span>
                <span className="nft-label">🏆 Winner NFTs</span>
              </div>
              <div className="nft-stat">
                <span className="nft-count">{Number(userRunnerUpBalance)}</span>
                <span className="nft-label">🥈 Runner-up NFTs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasWinner = currentWinner && currentWinner !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="game-board">
      {/* Round Header */}
      <div className="round-header">
        <div className="round-badge">Round {Number(currentRound)}</div>
        {hasWinner && (
          <div className="winner-badge">
            👑 Winner: {currentWinner?.slice(0, 6)}...{currentWinner?.slice(-4)}
          </div>
        )}
        {hasRoundStarted && (
          <div className="timer">
            ⏱️ {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {/* User Stats */}
      <div className="user-stats-bar">
        <div className="stat-item">
          <span className="stat-icon">🏆</span>
          <span className="stat-value">{Number(userFirstGuessBalance)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🥈</span>
          <span className="stat-value">{Number(userRunnerUpBalance)}</span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="game-area">
        {/* Current Guess Display */}
        <div className="guess-display">
          <div className="guess-letters">
            {currentGuess.split("").map((letter, i) => (
              <span key={i} className="guess-letter">{letter.toUpperCase()}</span>
            ))}
            {currentGuess.length === 0 && <span className="guess-placeholder">Type or click letters...</span>}
          </div>
        </div>

        {/* Honeycomb Letter Grid */}
        <div className="honeycomb-container">
          <div className="honeycomb">
            {/* Top row - 2 letters */}
            <div className="hex-row">
              {shuffledLetters.slice(0, 2).map((letter, i) => (
                <LetterTile
                  key={`top-${i}`}
                  letter={letter}
                  onClick={() => addLetter(letter)}
                  disabled={isSubmitting || isGenerating || hasAlreadyGuessed}
                />
              ))}
            </div>
            {/* Middle row - center letter */}
            <div className="hex-row middle">
              {shuffledLetters.slice(2, 3).map((letter, i) => (
                <LetterTile
                  key={`left-${i}`}
                  letter={letter}
                  onClick={() => addLetter(letter)}
                  disabled={isSubmitting || isGenerating || hasAlreadyGuessed}
                />
              ))}
              {centerLetter && (
                <LetterTile
                  letter={centerLetter}
                  isCenter
                  onClick={() => addLetter(centerLetter)}
                  disabled={isSubmitting || isGenerating || hasAlreadyGuessed}
                />
              )}
              {shuffledLetters.slice(3, 4).map((letter, i) => (
                <LetterTile
                  key={`right-${i}`}
                  letter={letter}
                  onClick={() => addLetter(letter)}
                  disabled={isSubmitting || isGenerating || hasAlreadyGuessed}
                />
              ))}
            </div>
            {/* Bottom row - 2 letters */}
            <div className="hex-row">
              {shuffledLetters.slice(4, 6).map((letter, i) => (
                <LetterTile
                  key={`bottom-${i}`}
                  letter={letter}
                  onClick={() => addLetter(letter)}
                  disabled={isSubmitting || isGenerating || hasAlreadyGuessed}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn-action btn-delete" 
            onClick={deleteLetter}
            disabled={currentGuess.length === 0 || isSubmitting || isGenerating}
          >
            ⌫ Delete
          </button>
          <button 
            className="btn-action btn-shuffle" 
            onClick={() => window.location.reload()}
            disabled={isSubmitting || isGenerating}
          >
            🔀 Shuffle
          </button>
          <button 
            className="btn-action btn-enter"
            onClick={handleSubmitGuess}
            disabled={
              currentGuess.length < 4 || 
              isSubmitting || 
              isGenerating || 
              hasAlreadyGuessed
            }
          >
            {isGenerating ? "🔐 Proving..." : isSubmitting ? "📤 Sending..." : "✓ Enter"}
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`status-message status-${statusType}`}>
            {statusMessage}
          </div>
        )}

        {/* Already Guessed Message */}
        {hasAlreadyGuessed && (
          <div className="already-guessed">
            🎉 You've already won this round! Wait for the next one.
          </div>
        )}

        {/* NFT Collection Display */}
        {(Number(userFirstGuessBalance) > 0 || Number(userRunnerUpBalance) > 0) && (
          <div className="nft-collection">
            <h4>🖼️ Your NFT Collection</h4>
            <div className="nft-gallery">
              {Number(userFirstGuessBalance) > 0 && (
                <div className="nft-card winner-nft">
                  <div className="nft-image">
                    <span className="nft-emoji">🏆</span>
                  </div>
                  <div className="nft-details">
                    <span className="nft-title">Winner NFT</span>
                    <span className="nft-amount">×{Number(userFirstGuessBalance)}</span>
                  </div>
                  <div className="nft-rarity">Legendary</div>
                </div>
              )}
              {Number(userRunnerUpBalance) > 0 && (
                <div className="nft-card runnerup-nft">
                  <div className="nft-image">
                    <span className="nft-emoji">🥈</span>
                  </div>
                  <div className="nft-details">
                    <span className="nft-title">Runner-Up NFT</span>
                    <span className="nft-amount">×{Number(userRunnerUpBalance)}</span>
                  </div>
                  <div className="nft-rarity">Rare</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Found Words */}
        {foundWords.length > 0 && (
          <div className="found-words">
            <h4>Your Words</h4>
            <div className="word-list">
              {foundWords.map((word, i) => (
                <span key={i} className="found-word">{word}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="game-instructions">
        <p>📝 Create words using the letters. Must include the <strong>center letter</strong>.</p>
        <p>🔐 Your guess is verified with a <strong>Zero-Knowledge Proof</strong> - the answer stays secret!</p>
      </div>
    </div>
  );
};
