import { createConfig, http } from "wagmi";
import { foundry } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { getConfig } from "./contracts";

const contractConfig = getConfig();

// Use foundry chain (same as Anvil - chain ID 31337)
// Override RPC URL to point to local Anvil
export const anvilChain = {
  ...foundry,
  rpcUrls: {
    default: {
      http: [contractConfig.RPC_URL],
    },
  },
};

export const wagmiConfig = createConfig({
  chains: [anvilChain],
  connectors: [injected()],
  transports: {
    [anvilChain.id]: http(contractConfig.RPC_URL),
  },
});
