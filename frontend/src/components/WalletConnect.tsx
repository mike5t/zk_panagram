import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { formatAddress } from "../utils/crypto";
import "./WalletConnect.css";

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="wallet-connect">
      {isConnected ? (
        <div className="wallet-info">
          <span className="wallet-address">{formatAddress(address!)}</span>
          <button onClick={() => disconnect()} className="btn-disconnect">
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={() => connect({ connector: injected() })}
          className="btn-connect"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};
