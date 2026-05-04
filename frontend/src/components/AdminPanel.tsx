import { useState } from "react";
import { useAccount } from "wagmi";
import { usePanagramState, useNewRound, storeGameLetters } from "../hooks/usePanagram";
import { computeAnswerDoubleHash } from "../utils/crypto";
import "./AdminPanel.css";

// Generate unique letters from a word
const getUniqueLetters = (word: string): string[] => {
  return [...new Set(word.toLowerCase().split(""))].filter(l => /[a-z]/.test(l));
};

export const AdminPanel = () => {
  const { address } = useAccount();
  const { isOwner, isOwnerLoading, roundStartTime, minDuration, currentRound } = usePanagramState();
  const { newRound, isLoading } = useNewRound();

  const [answerWord, setAnswerWord] = useState("");
  const [allLetters, setAllLetters] = useState("");
  const [centerLetter, setCenterLetter] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");

  // Don't render if still loading owner data or not the owner
  if (isOwnerLoading) {
    return null; // Still loading
  }
  
  if (!isOwner) {
    return null;
  }

  const canStartNewRound = (): boolean => {
    if (!currentRound || Number(currentRound) === 0) return true; // First round
    if (!roundStartTime || !minDuration) return true;
    const nextRoundTime = Number(roundStartTime) + Number(minDuration);
    const now = Math.floor(Date.now() / 1000);
    return now >= nextRoundTime;
  };

  // Auto-generate letters from answer word
  const handleAnswerChange = (value: string) => {
    setAnswerWord(value);
    if (value.length >= 4) {
      const unique = getUniqueLetters(value);
      // Add some extra random letters to make it harder
      const extraLetters = ["a", "e", "i", "o", "u", "s", "t", "n", "r", "l"];
      const combined = [...new Set([...unique, ...extraLetters.slice(0, 7 - unique.length)])];
      setAllLetters(combined.slice(0, 7).join("").toUpperCase());
      if (!centerLetter && value.length > 0) {
        setCenterLetter(value[0].toUpperCase());
      }
    }
  };

  const handleStartRound = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!answerWord || answerWord.length < 4) {
      setStatusMessage("Answer must be at least 4 letters!");
      setStatusType("error");
      return;
    }

    if (allLetters.length < 6 || allLetters.length > 7) {
      setStatusMessage("Please provide 6-7 letters for the game!");
      setStatusType("error");
      return;
    }

    if (!centerLetter || centerLetter.length !== 1) {
      setStatusMessage("Please select a center letter!");
      setStatusType("error");
      return;
    }

    // Check that answer uses only the available letters
    const availableSet = new Set(allLetters.toLowerCase().split(""));
    const answerLetters = answerWord.toLowerCase().split("");
    const invalidLetters = answerLetters.filter(l => !availableSet.has(l));
    if (invalidLetters.length > 0) {
      setStatusMessage(`Answer contains letters not in the game: ${invalidLetters.join(", ")}`);
      setStatusType("error");
      return;
    }

    // Check answer contains center letter
    if (!answerWord.toLowerCase().includes(centerLetter.toLowerCase())) {
      setStatusMessage("Answer must contain the center letter!");
      setStatusType("error");
      return;
    }

    setStatusMessage("Starting new round...");
    setStatusType("info");

    try {
      // Compute double hash of the answer
      const answerDoubleHash = computeAnswerDoubleHash(answerWord.toLowerCase());

      console.log("Setting answer:", answerWord);
      console.log("Answer double hash:", answerDoubleHash);
      console.log("Letters:", allLetters);
      console.log("Center letter:", centerLetter);

      await newRound(answerDoubleHash);

      // Store game letters in localStorage for the new round
      const nextRound = Number(currentRound || 0) + 1;
      const letters = allLetters.toUpperCase().split("");
      storeGameLetters(nextRound, letters, centerLetter.toUpperCase());

      setAnswerWord("");
      setAllLetters("");
      setCenterLetter("");
      setStatusMessage("🎉 New round started successfully!");
      setStatusType("success");
      
      // Reload to show new game
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setStatusMessage(`Error: ${errorMsg}`);
      setStatusType("error");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h3>🔧 Admin Panel</h3>
        <span className="admin-badge">Owner: {address?.slice(0, 6)}...</span>
      </div>

      <form onSubmit={handleStartRound} className="admin-form">
        <div className="form-section">
          <label>Secret Answer Word</label>
          <input
            type="text"
            value={answerWord}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="e.g., PANGRAM"
            disabled={isLoading || !canStartNewRound()}
            className="input-field"
            minLength={4}
          />
          <p className="hint">The word players need to guess (min 4 letters)</p>
        </div>

        <div className="form-section">
          <label>Game Letters (6-7 letters)</label>
          <input
            type="text"
            value={allLetters}
            onChange={(e) => setAllLetters(e.target.value.toUpperCase().slice(0, 7))}
            placeholder="e.g., PANGMRT"
            disabled={isLoading || !canStartNewRound()}
            className="input-field"
            maxLength={7}
          />
          <p className="hint">Letters that will be shown to players</p>
        </div>

        <div className="form-section">
          <label>Center Letter</label>
          <div className="center-letter-select">
            {allLetters.split("").map((letter) => (
              <button
                key={letter}
                type="button"
                className={`letter-option ${centerLetter === letter ? "selected" : ""}`}
                onClick={() => setCenterLetter(letter)}
                disabled={isLoading || !canStartNewRound()}
              >
                {letter}
              </button>
            ))}
          </div>
          <p className="hint">Players must use this letter in their guess</p>
        </div>

        {/* Preview */}
        {allLetters.length >= 6 && centerLetter && (
          <div className="preview-section">
            <h4>Preview</h4>
            <div className="preview-honeycomb">
              {allLetters.split("").filter(l => l !== centerLetter).slice(0, 6).map((letter, i) => (
                <span key={i} className="preview-letter">{letter}</span>
              ))}
              <span className="preview-letter center">{centerLetter}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={
            !answerWord || 
            answerWord.length < 4 || 
            allLetters.length < 6 || 
            !centerLetter || 
            isLoading || 
            !canStartNewRound()
          }
          className="btn-start-round"
        >
          {isLoading ? "⏳ Starting..." : "🚀 Start New Round"}
        </button>
      </form>

      {!canStartNewRound() && (
        <div className="warning-message">
          ⏰ Minimum duration has not passed. Please wait before starting the next round.
        </div>
      )}

      {statusMessage && (
        <div className={`status-message status-${statusType}`}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};
