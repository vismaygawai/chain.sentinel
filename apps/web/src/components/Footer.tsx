export default function Footer() {
  return (
    <footer className="border-t-2 border-black bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b-2 border-black pb-12">
          
          {/* Column 1: Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-electric border-2 border-black shadow-hard-sm"></div>
              <span className="font-display text-2xl font-black uppercase tracking-tight">
                CHAIN<span className="text-electric">.</span>SENTINEL
              </span>
            </div>
            <p className="font-serif italic text-lg text-gray-700 max-w-md">
              Real-time on-chain defensive layer for DeFi treasuries. Built to prevent catastrophic liquidation loss and exploit cascades before they settle.
            </p>
              <div className="inline-block border-2 border-black px-3 py-1 font-mono text-xs uppercase bg-[#f4f4f4] shadow-hard-sm">
              ELECTROTHON 8.0 // WWHS?
            </div>
          </div>

          {/* Column 2: Architecture */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-black uppercase tracking-wider text-black border-b-2 border-black pb-1 inline-block">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs font-mono font-medium text-gray-700">
              <li>ADK-TS (@iqai/adk)</li>
              <li>Agent Tokenization Platform</li>
              <li>LiquidShield Aave V3</li>
              <li>WhaleWatch Mempool Engine</li>
              <li>Alert Correlator Engine</li>
            </ul>
          </div>

          {/* Column 3: Ecosystem */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-black uppercase tracking-wider text-black border-b-2 border-black pb-1 inline-block">
              Ecosystem & Hackathon
            </h4>
            <ul className="space-y-2 text-xs font-mono font-medium text-gray-700">
              <li><a href="https://devfolio.co/projects/chain-sentinel-f7cf" target="_blank" rel="noreferrer" className="hover:text-electric transition-colors">Devfolio Submission</a></li>
              <li><a href="https://aave.com" target="_blank" rel="noreferrer" className="hover:text-electric transition-colors">Aave Protocol</a></li>
              <li><a href="https://ethereum.org" target="_blank" rel="noreferrer" className="hover:text-electric transition-colors">Ethereum Ecosystem</a></li>
              <li><a href="https://github.com/vismaygawai/chain.sentinel" target="_blank" rel="noreferrer" className="hover:text-electric transition-colors">GitHub Repository</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-gray-600">
          <div>
            Built by WWHS? for ELECTROTHON 8.0. Open-Source under MIT License.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Mainnet Monitor Online
            </span>
            <a
              href="https://devfolio.co/projects/chain-sentinel-f7cf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black font-bold uppercase hover:text-electric transition-colors"
            >
              Devfolio Project Link ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
