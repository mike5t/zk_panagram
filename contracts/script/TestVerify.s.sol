// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HonkVerifier} from "../src/Verifier.sol";

contract TestVerifyScript is Script {
    function run() external view {
        HonkVerifier verifier = HonkVerifier(0xc6e7DF5E7b4f2A278906862b61205850344D4e7d);
        
        // Build public inputs - 32 bytes for answer hash + 1 for address
        bytes32[] memory publicInputs = new bytes32[](33);
        
        // Answer double hash bytes
        uint8[32] memory answerBytes = [157, 12, 124, 4, 206, 169, 68, 49, 49, 209, 226, 101, 179, 206, 196, 142, 64, 167, 202, 124, 83, 128, 89, 51, 106, 22, 52, 244, 253, 155, 202, 0];
        
        for (uint256 i = 0; i < 32; i++) {
            publicInputs[i] = bytes32(uint256(answerBytes[i]));
        }
        
        // Address
        publicInputs[32] = bytes32(uint256(uint160(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)));
        
        console.log("Testing with hardcoded small proof (will fail, just testing setup)");
        
        bytes memory fakeProof = hex"00";
        
        try verifier.verify(fakeProof, publicInputs) returns (bool result) {
            console.log("Verification result:", result);
        } catch {
            console.log("Verification reverted as expected for fake proof");
        }
    }
}
