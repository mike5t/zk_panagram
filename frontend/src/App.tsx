import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletConnect } from "./components/WalletConnect";
import { GameBoard } from "./components/GameBoard";
import { AdminPanel } from "./components/AdminPanel";
import { wagmiConfig } from "./config/wagmi";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <div className="app">
          <header className="header">
            <div className="header-content">
              <h1>🎮 Panagram ZK Game</h1>
              <WalletConnect />
            </div>
          </header>

          <main className="main">
            <div className="container">
              <AdminPanel />
              <GameBoard />
            </div>
          </main>

          <footer className="footer">
            <p>Zero-Knowledge Panagram Game • Built with Noir & Solidity</p>
          </footer>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
