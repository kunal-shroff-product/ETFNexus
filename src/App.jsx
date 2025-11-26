import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { LayoutDashboard, Search, Activity, Calculator, Layers, TrendingUp, TrendingDown, Minus, Home, Settings as SettingsIcon, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import rawData from './etf_data.json';

// --- Utility Hook ---
function useBreakpoint(bp = 768) {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < bp : false);
  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < bp);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [bp]);
  return isMobile;
}

// --- Data & Theme ---
const etfList = Array.isArray(rawData) ? rawData : rawData.etfs || [];
const tickerTape = !Array.isArray(rawData) ? rawData.tickerTape || [] : [];
const THEME = {
  bg: "#111316", sidebar: "#0d0f12", card: "#1a1d21", border: "#2b2f36",
  text: "#f3f4f6", textDim: "#9ca3af", accent: "#eab308",
  success: "#10b981", danger: "#ef4444",
  pie: ["#eab308", "#3b82f6", "#ec4899", "#6366f1"]
};

// --- Shared Components ---
const Card = ({ children, className = "" }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
    className={`rounded-2xl p-4 sm:p-6 border ${className}`} style={{ backgroundColor: THEME.card, borderColor: THEME.border }}>
    {children}
  </motion.div>
);

const TabButton = ({ active, label, icon: Icon, onClick }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
      active ? 'text-black shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-[#2b2f36]'
    }`} style={{ backgroundColor: active ? THEME.accent : 'transparent' }}>
    <Icon size={16} strokeWidth={2.5} /> {label}
  </button>
);

const getSignal = (price, ema100, ema200) => {
  if (!price || !ema100 || !ema200) return { label: "HOLD", color: THEME.textDim, icon: Minus };
  if (price < ema100 && price < ema200) return { label: "STRONG BUY", color: THEME.success, icon: TrendingUp };
  if (price > ema100 * 1.05 && price > ema200 * 1.08) return { label: "SELL", color: THEME.danger, icon: TrendingDown };
  return { label: "HOLD", color: "#64748b", icon: Minus };
};

const TickerTape = () => (
  <div style={{ backgroundColor: THEME.sidebar, borderColor: THEME.border }} className="border-b overflow-hidden py-2 h-10 text-xs">
    <motion.div className="flex gap-8 px-3 font-bold whitespace-nowrap"
      animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }}>
      {[...tickerTape, ...tickerTape].map((stock, i) => (
        <div key={i} className="flex items-center gap-3 uppercase tracking-wider">
          <span style={{ color: THEME.textDim }}>{stock.name}</span>
          <span style={{ color: stock.change >= 0 ? THEME.success : THEME.danger }}>
            {stock.price} ({stock.change > 0 ? '+' : ''}{stock.change}%)
          </span>
        </div>
      ))}
    </motion.div>
  </div>
);

// --- Page Components ---

const OverviewTab = ({ data }) => (
  <div className="space-y-4 sm:space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {[ { label: "52W Low", val: `₹${data.low52 || 0}` }, { label: "52W High", val: `₹${data.high52 || 0}` },
        { label: "3Y CAGR", val: `${data.cagr || 0}%`, color: THEME.success },
        { label: "Holdings", val: data.constituents?.length || 0, color: THEME.accent }
      ].map((stat, i) => (
        <div key={i} className="p-2 sm:p-4 rounded-xl border" style={{ backgroundColor: THEME.card, borderColor: THEME.border }}>
          <div className="text-xs font-bold uppercase mb-1" style={{ color: THEME.textDim }}>{stat.label}</div>
          <div className="text-base sm:text-xl font-bold" style={{ color: stat.color || THEME.text }}>{stat.val}</div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
      <Card className="lg:col-span-2 h-[320px] sm:h-[400px] min-w-0 overflow-x-auto">
        <h3 className="text-sm font-bold text-white mb-4">Price Trend (1Y)</h3>
        <ResponsiveContainer width="100%" height="95%"><LineChart data={data.history}>
            <Tooltip formatter={(v) => [`₹${v}`, 'Price']} labelFormatter={(l) => `Date: ${l}`}
              contentStyle={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: '8px' }}/>
            <XAxis dataKey="date" tick={{ fill: THEME.textDim, fontSize: 10 }} minTickGap={15} tickFormatter={d => d.slice(5)} stroke={THEME.border}/>
            <YAxis domain={['auto', 'auto']} tick={{ fill: THEME.textDim, fontSize: 10 }} stroke={THEME.border}/>
            <Line type="monotone" dataKey="price" stroke={THEME.accent} strokeWidth={3} dot={false}/>
        </LineChart></ResponsiveContainer>
      </Card>
      <Card className="h-[320px] sm:h-[400px] flex flex-col">
        <h3 className="text-sm font-bold text-white mb-4">Asset Allocation</h3>
        <ResponsiveContainer width="100%" height="90%"><PieChart>
            <Pie data={[{ name: 'Large', value: 70 }, { name: 'Mid', value: 20 }, { name: 'Small', value: 10 }]}
                 innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {[0,1,2].map((_, idx) => <Cell key={`c-${idx}`} fill={THEME.pie[idx % THEME.pie.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: THEME.card, borderColor: THEME.border, borderRadius: '8px' }}/>
            <Legend verticalAlign="bottom" />
        </PieChart></ResponsiveContainer>
      </Card>
    </div>
  </div>
);

const ConstituentsTab = ({ holdings }) => (
  <div className="grid grid-cols-1 gap-3 sm:gap-5">
    {holdings && holdings.map((h, i) => {
      const signal = getSignal(h.price, h.ema100, h.ema200);
      const SignalIcon = signal.icon;
      return (
        <Card key={i} className="hover:border-yellow-500/50 transition-all">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-lg">{h.name}</h4>
                <div className="text-2xl font-mono font-bold text-yellow-500 mt-1">₹{h.price}</div>
              </div>
              <div className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 border`}
                   style={{ backgroundColor: `${signal.color}15`, color: signal.color, borderColor: signal.color }}>
                <SignalIcon size={14} /> {signal.label}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-gray-800">
              <div>
                <div className="text-gray-500 mb-1">EMA 100 | EMA 200</div>
                <div className="font-mono text-white font-medium">₹{h.ema100} | ₹{h.ema200}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 mb-1">52W High / Low</div>
                <div className="font-mono text-white font-medium">₹{h.high52} / ₹{h.low52}</div>
              </div>
            </div>
          </div>
        </Card>
      );
    })}
    {(!holdings || holdings.length === 0) && <div className="text-center text-gray-500 py-10">No constituents available.</div>}
  </div>
);

const CalculatorTab = ({ etfOptions, initialETF, mobile }) => {
  const [investment, setInvestment] = useState(100000);
  const [years, setYears] = useState(5);
  const [selected, setSelected] = useState(initialETF || etfOptions[0]);

  // Use selected for mobile (dropdown), initialETF for desktop (fixed)
  const activeETF = mobile ? selected : initialETF;
  const cagr = activeETF?.cagr ?? 12;
  const futureValue = Math.round(investment * Math.pow((1 + (cagr) / 100), years));
  const profit = futureValue - investment;

  return (
    <Card>
      <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b" style={{borderColor: THEME.border}}>
        <div className="p-2 rounded-lg text-black bg-yellow-500"><Calculator size={24}/></div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white">SIP Calculator</h3>
          <p className="text-sm" style={{color: THEME.textDim}}>CAGR: {cagr}% ({activeETF?.id})</p>
        </div>
      </div>

      {mobile && (
        <div className="mb-6">
          <label className="text-gray-400 font-medium mb-2 block text-sm">Select ETF</label>
          <select 
            className="w-full bg-[#0d0f12] border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
            value={selected.id}
            onChange={(e) => setSelected(etfOptions.find(x => x.id === e.target.value))}
          >
            {etfOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.id} - {opt.category}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-gray-400 font-medium">Amount</label>
            <div className="text-lg font-bold text-yellow-500">₹{investment.toLocaleString()}</div>
          </div>
          <input type="range" min="5000" max="1000000" step="5000" value={investment} onChange={(e) => setInvestment(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"/>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-gray-400 font-medium">Duration</label>
            <div className="text-lg font-bold text-yellow-500">{years} Years</div>
          </div>
          <input type="range" min="1" max="20" step="1" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"/>
        </div>

        <div className="p-6 rounded-xl bg-[#0d0f12] border border-gray-800 text-center mt-4">
          <div className="text-gray-500 text-sm mb-2">Expected Value</div>
          <div className="text-3xl font-black text-white mb-2">₹{futureValue.toLocaleString()}</div>
          <div className="text-emerald-400 text-sm font-bold flex justify-center items-center gap-1">
            <TrendingUp size={14} /> Profit: ₹{profit.toLocaleString()}
          </div>
        </div>
      </div>
    </Card>
  );
};

// --- Mobile Bottom Nav ---
const MobileNav = ({ current, onNav }) => (
  <nav className="fixed bottom-0 left-0 w-full h-16 bg-[#0d0f12] border-t border-gray-800 flex justify-around z-50 md:hidden pb-safe">
    <button onClick={() => onNav('home')} className="flex flex-col items-center justify-center w-full gap-1">
      <Home size={20} className={current === 'home' ? 'text-yellow-500' : 'text-gray-500'} />
      <span className={`text-[10px] font-medium ${current === 'home' ? 'text-yellow-500' : 'text-gray-500'}`}>Home</span>
    </button>
    <button onClick={() => onNav('calculator')} className="flex flex-col items-center justify-center w-full gap-1">
      <Calculator size={20} className={current === 'calculator' ? 'text-yellow-500' : 'text-gray-500'} />
      <span className={`text-[10px] font-medium ${current === 'calculator' ? 'text-yellow-500' : 'text-gray-500'}`}>Calculator</span>
    </button>
    <button onClick={() => onNav('settings')} className="flex flex-col items-center justify-center w-full gap-1">
      <SettingsIcon size={20} className={current === 'settings' ? 'text-yellow-500' : 'text-gray-500'} />
      <span className={`text-[10px] font-medium ${current === 'settings' ? 'text-yellow-500' : 'text-gray-500'}`}>Settings</span>
    </button>
  </nav>
);

// --- MAIN APP COMPONENT ---
export default function App() {
  const isMobile = useBreakpoint();

  // State
  const [mobileView, setMobileView] = useState('home'); // 'home', 'details', 'calculator', 'settings'
  const [selectedId, setSelectedId] = useState(etfList[0]?.id || ""); // Works for both mobile details & desktop
  const [tab, setTab] = useState('overview'); // Active tab within details view

  if (!etfList.length) return <div className="flex items-center justify-center h-screen bg-[#111316] text-white">Loading Data...</div>;

  const selectedETF = etfList.find(e => e.id === selectedId) || etfList[0];

  // --- RENDER: MOBILE ---
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#111316] text-white pb-20 font-sans selection:bg-yellow-500/30">
        {/* Mobile Header */}
        <div className="sticky top-0 z-20 bg-[#111316]/95 backdrop-blur-sm border-b border-gray-800">
          <div className="flex items-center justify-center h-12 relative">
            {mobileView === 'details' && (
              <button onClick={() => setMobileView('home')} className="absolute left-4 text-yellow-500 flex items-center gap-1 text-sm font-bold">
                <ChevronLeft size={18} /> Back
              </button>
            )}
            <span className="font-black text-lg tracking-tight text-yellow-500">ETF Nexus</span>
          </div>
          <TickerTape />
        </div>

        {/* Mobile Content */}
        <div className="p-3">
          {mobileView === 'home' && (
            <div className="grid grid-cols-1 gap-3">
              {etfList.map(etf => (
                <div key={etf.id} onClick={() => { setSelectedId(etf.id); setMobileView('details'); setTab('overview'); }}
                  className="bg-[#1a1d21] border border-[#2b2f36] p-4 rounded-2xl active:scale-[0.98] transition-transform cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold">{etf.id}</h3>
                      <p className="text-xs text-gray-400">{etf.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-yellow-500">₹{etf.price}</div>
                      <div className={`text-xs font-mono ${etf.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {etf.change >= 0 ? '+' : ''}{etf.change}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mobileView === 'details' && (
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-4">
                  <h1 className="text-3xl font-black">{selectedETF.id}</h1>
                  <p className="text-sm text-gray-400 line-clamp-2">{selectedETF.desc}</p>
                </div>

                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                  {['Overview', 'Constituents', 'Calculator'].map((t) => (
                    <button key={t} onClick={() => setTab(t.toLowerCase())}
                      className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                        tab === t.toLowerCase() ? 'bg-yellow-500 text-black' : 'bg-[#2b2f36] text-gray-400'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>

                {tab === 'overview' && <OverviewTab data={selectedETF} />}
                {tab === 'constituents' && <ConstituentsTab holdings={selectedETF.constituents} />}
                {tab === 'calculator' && <CalculatorTab etfOptions={etfList} initialETF={selectedETF} mobile={false} />} 
                {/* Note: Inside details, calc is specific to this ETF, so mobile=false to hide dropdown */}
              </motion.div>
            </AnimatePresence>
          )}

          {mobileView === 'calculator' && (
            <CalculatorTab etfOptions={etfList} initialETF={etfList[0]} mobile={true} />
          )}

          {mobileView === 'settings' && (
            <div className="text-center py-20 text-gray-500">Settings Module Coming Soon</div>
          )}
        </div>

        <MobileNav current={mobileView === 'details' ? 'home' : mobileView} onNav={(view) => setMobileView(view)} />
      </div>
    );
  }

  // --- RENDER: DESKTOP ---
  return (
    <div className="flex flex-col h-screen font-sans bg-[#111316] text-white selection:bg-yellow-500/30">
      <div className="border-b border-gray-800"><TickerTape /></div>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex flex-col w-64 border-r border-gray-800 bg-[#0d0f12]">
          <div className="p-6 flex items-center gap-2 text-yellow-500 font-bold text-xl border-b border-gray-800">
            <Activity /> ETF Nexus
          </div>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input type="text" placeholder="Search..." className="w-full bg-[#1a1d21] border border-gray-700 rounded-xl py-2 pl-9 pr-4 text-sm focus:border-yellow-500 outline-none"/>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {etfList.map(etf => (
              <button key={etf.id} onClick={() => { setSelectedId(etf.id); setTab('overview'); }}
                className={`w-full p-3 rounded-xl text-left flex justify-between items-center transition-all ${selectedId === etf.id ? 'bg-[#2b2f36] text-white border-l-4 border-yellow-500' : 'text-gray-400 hover:bg-[#1a1d21]'}`}>
                <span className="font-medium text-sm">{etf.id}</span>
                <span className={`text-xs font-mono ${etf.change>=0?'text-emerald-400':'text-rose-500'}`}>{etf.change}%</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="px-8 pt-8 pb-6 border-b border-gray-800">
            <h1 className="text-4xl font-black mb-2">{selectedETF.id}</h1>
            <p className="text-gray-400 mb-4 max-w-2xl">{selectedETF.desc}</p>
            <div className="flex items-end gap-4">
              <div className="text-4xl font-bold">₹{selectedETF.price}</div>
              <div className={`text-lg font-bold mb-1 ${selectedETF.change>=0?'text-emerald-400':'text-rose-400'}`}>
                {selectedETF.change>=0?'+':''}{selectedETF.change}%
              </div>
            </div>
          </header>

          <div className="px-8 mt-6 flex gap-4 border-b border-gray-800">
            {['Overview', 'Constituents', 'Calculator'].map(t => (
              <button key={t} onClick={() => setTab(t.toLowerCase())}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${tab === t.toLowerCase() ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-gray-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div key={tab + selectedId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-7xl mx-auto">
                {tab === 'overview' && <OverviewTab data={selectedETF} />}
                {tab === 'constituents' && <ConstituentsTab holdings={selectedETF.constituents} />}
                {tab === 'calculator' && <CalculatorTab etfOptions={etfList} initialETF={selectedETF} mobile={false} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}