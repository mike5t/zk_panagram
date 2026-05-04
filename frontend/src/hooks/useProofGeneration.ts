import { useState, useCallback, useRef } from "react";
import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";
import { computeGuessHash, hexToBytes, addressToField } from "../utils/crypto";

interface ProofGenerationResult {
  proof: `0x${string}`;
  publicInputs: string[];
}

interface CircuitArtifact {
  bytecode: string;
  abi: unknown;
}

export const useProofGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const circuitRef = useRef<CircuitArtifact | null>(null);
  const noirRef = useRef<Noir | null>(null);
  const backendRef = useRef<UltraHonkBackend | null>(null);

  // Load circuit artifact from public folder
  const loadCircuit = useCallback(async (): Promise<CircuitArtifact> => {
    if (circuitRef.current) return circuitRef.current;

    const response = await fetch("/zk_panagram.json");
    if (!response.ok) {
      throw new Error("Failed to load circuit artifact");
    }
    const circuit = await response.json();
    circuitRef.current = circuit;
    return circuit;
  }, []);

  // Initialize Noir and backend
  const initializeNoir = useCallback(async () => {
    if (noirRef.current && backendRef.current) {
      return { noir: noirRef.current, backend: backendRef.current };
    }

    const circuit = await loadCircuit();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const noir = new Noir(circuit as any);
    const backend = new UltraHonkBackend(circuit.bytecode, { threads: 1 });

    noirRef.current = noir;
    backendRef.current = backend;

    return { noir, backend };
  }, [loadCircuit]);

  const generateProof = useCallback(
    async (
      guess: string,
      answerDoubleHash: `0x${string}`,
      userAddress: `0x${string}`
    ): Promise<ProofGenerationResult> => {
      setIsGenerating(true);
      setError(null);

      try {
        // Initialize Noir and backend
        const { noir, backend } = await initializeNoir();

        // Compute the guess hash (keccak256 of the plaintext guess)
        const guessHash = computeGuessHash(guess);

        // Convert inputs to circuit format
        // guess_hash_bytes: 32-byte array (private)
        // answer_double_hash: 32-byte array (public)
        // address: Field as decimal string (public)
        const inputs = {
          guess_hash_bytes: hexToBytes(guessHash),
          answer_double_hash: hexToBytes(answerDoubleHash),
          address: addressToField(userAddress),
        };

        console.log("Circuit inputs:", inputs);

        // Execute the circuit to create a witness
        const { witness } = await noir.execute(inputs);

        // Generate the proof using UltraHonk backend with keccak enabled
        const { proof } = await backend.generateProof(witness, { keccak: true });

        // Convert proof to hex string
        const proofHex = `0x${Array.from(proof)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")}` as `0x${string}`;

        console.log("Proof generated successfully");

        return {
          proof: proofHex,
          publicInputs: [answerDoubleHash, userAddress],
        };
      } catch (err) {
        console.error("Proof generation error:", err);
        const errorMsg =
          err instanceof Error ? err.message : "Failed to generate proof";
        setError(errorMsg);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [initializeNoir]
  );

  return { generateProof, isGenerating, error };
};
