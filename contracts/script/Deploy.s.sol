// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HonkVerifier} from "../src/Verifier.sol";
import {Panagram} from "../src/Panagram.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy verifier
        HonkVerifier verifier = new HonkVerifier();
        console.log("HonkVerifier deployed at:", address(verifier));

        // Deploy panagram with verifier
        Panagram panagram = new Panagram(verifier);
        console.log("Panagram deployed at:", address(panagram));

        vm.stopBroadcast();

        // Print addresses for frontend config
        console.log("\n=== Deployment Complete ===");
        console.log("VITE_PANAGRAM_ADDRESS=", address(panagram));
        console.log("VERIFIER_ADDRESS=", address(verifier));
    }
}
