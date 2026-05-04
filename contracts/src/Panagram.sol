// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IVerifier} from "./Verifier.sol";

// Panagram: A game where players submit ZK proofs that they know the secret answer.
// First correct solver of a round receives token id 0, subsequent correct solvers receive token id 1.
contract Panagram is ERC1155, Ownable {
    // Immutable / constant config
    uint256 public constant MIN_DURATION = 10800; // 3 hours

    // External verifier
    IVerifier public s_verifier;

    // Round state
    uint256 public s_roundStartTime; // set when a round starts
    address public s_currentRoundWinner; // first winner per round
    bytes32 public s_answer; // hashed answer/public input value
    uint256 public s_currentRound; // round counter starts at 0 before first round

    // Track if an address has already correctly guessed in a given round
    mapping(address => uint256) public s_lastCorrectGuessRound;

    // Events
    event Panagram_VerifierUpdated(IVerifier verifier);
    event Panagram_NewRoundStarted(bytes32 answer, uint256 indexed roundStartTime, uint256 indexed round);
    event Panagram__WinnerCrowned(address indexed winner, uint256 round);
    event Panagram__RunnerUp(address indexed runnerUp, uint256 indexed round);

    // Errors
    error Panagram_MinTimeNotPassed(uint256 minDuration, uint256 timePassed);
    error Panagram__NoRoundWinner();
    error Panagram__FirstPanagramNotSet();
    error Panagram__AlreadyGuessedCorrectly(uint256 round, address user);
    error Panagram__InvalidProof();

    constructor(IVerifier _verifier)
        ERC1155("ipfs://QmNh1mHjjA9PX9osZdoHYyUVXTcZT8GtvF85K3PXQuCCL1/{id}.json")
        Ownable(msg.sender)
    {
        s_verifier = _verifier;
    }

    // function to create a new round
    function newRound(bytes32 _answer) external onlyOwner {
        if (s_currentRound == 0) {
            // First ever round (no requirement on previous winner)
            s_roundStartTime = block.timestamp;
            s_answer = _answer;
        } else {
            // Require min duration for current round
            if (block.timestamp < s_roundStartTime + MIN_DURATION) {
                revert Panagram_MinTimeNotPassed(MIN_DURATION, block.timestamp - s_roundStartTime);
            }
            // Ensure we had a winner for the previous round
            if (s_currentRoundWinner == address(0)) {
                revert Panagram__NoRoundWinner();
            }
            // Start new round
            s_roundStartTime = block.timestamp;
            s_currentRoundWinner = address(0);
            s_answer = _answer;
        }

        unchecked { ++s_currentRound; }

        emit Panagram_NewRoundStarted(_answer, s_roundStartTime, s_currentRound);
    }
    
    // function to allow users to submit a guess
    function makeGuess(bytes calldata proof) external returns (bool) {
        // check whether the first round has started
        if (s_currentRound == 0) {
            revert Panagram__FirstPanagramNotSet();
        }
        // check if the the user has already guessed correctly
        if (s_lastCorrectGuessRound[msg.sender] == s_currentRound) {
             revert Panagram__AlreadyGuessedCorrectly(s_currentRound, msg.sender);
        }
        
        // Build public inputs array: 32 bytes for answer hash + 1 for address = 33 elements
        // Each byte of the answer hash becomes a separate bytes32 element
        bytes32[] memory publicInputs = new bytes32[](33);
        
        // Split s_answer (bytes32) into 32 individual byte values
        for (uint256 i = 0; i < 32; i++) {
            publicInputs[i] = bytes32(uint256(uint8(s_answer[i])));
        }
        
        // Address as the 33rd public input
        publicInputs[32] = bytes32(uint256(uint160(msg.sender)));
        
        bool proofResults = s_verifier.verify(proof, publicInputs);
        if(!proofResults){
            revert Panagram__InvalidProof();
        }
        s_lastCorrectGuessRound[msg.sender] = s_currentRound;
        
        // if correct, check if they are firt, if they are then mint NFT ID 0
        if (s_currentRoundWinner == address(0)) {
            s_currentRoundWinner = msg.sender;
            _mint(msg.sender, 0, 1, ""); // mint NFT ID 0
            emit Panagram__WinnerCrowned(msg.sender, s_currentRound);
        
        } else {
            _mint(msg.sender, 1, 1, ""); // mint NFT ID 1

            emit Panagram__RunnerUp(msg.sender, s_currentRound);
        }

        return proofResults;
        // if they are not first, mint NFT ID 1
    }

    // Set a new verifier implementation (upgrade path)
    function setVerifier(IVerifier _verifier) external onlyOwner {
        s_verifier = _verifier;
        emit Panagram_VerifierUpdated(_verifier);
    }
    

}