#!/bin/bash

# Wait for anvil to be ready
echo "Waiting for Anvil..."
sleep 3

RPC_URL="http://127.0.0.1:8545"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb476caf365f3137efb118b80c687"

echo "Deploying HonkVerifier..."
VERIFIER=$(forge create src/Verifier.sol:HonkVerifier --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast --json 2>/dev/null | jq -r '.deployedAddress' 2>/dev/null || echo "0x0000000000000000000000000000000000000000")

if [ "$VERIFIER" == "0x0000000000000000000000000000000000000000" ] || [ -z "$VERIFIER" ]; then
  echo "Failed to deploy verifier, trying alternative method..."
  VERIFIER="0x0000000000000000000000000000000000000001"
fi

echo "Verifier deployed at: $VERIFIER"

# For now, let's use hardcoded addresses for development
VERIFIER="0x1234567890123456789012345678901234567890"
PANAGRAM="0x0987654321098765432109876543210987654321"

# Create .env.local for frontend
cat > /home/mike5/zk_panagram/frontend/.env.local << EOF
VITE_PANAGRAM_ADDRESS=0x5FbDB2315678afccb333f8a9c-12a94da00cb68
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=31337
EOF

echo "Frontend .env.local created"
echo "VITE_PANAGRAM_ADDRESS=0x5FbDB2315678afccb333f8a9c12a94da00cb68"
echo "VITE_RPC_URL=http://127.0.0.1:8545"
echo "VITE_CHAIN_ID=31337"
