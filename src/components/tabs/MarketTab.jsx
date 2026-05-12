import React, { useRef, useEffect } from 'react';
import { Search, RefreshCw, TrendingUp, Coins, Gauge, Globe, ExternalLink } from 'lucide-react';
import { glassPanel, glassButton, glassInput, headingFont } from '../../styles';
import { QUICK_COINS } from '../../constants';
import { formatNumber } from '../../utils/recordTx';

function TradingViewWidget({ symbol, isCustom }) {
    const containerRef = useRef(null);
    const containerId = `tv-${Math.random().toString(36).substr(2, 9)}`;
    useEffect(() => {
        let tvInterval;
        const load = () => {
            if (window.TradingView && containerRef.current) {
                containerRef.current.innerHTML = "";
                const finalSymbol = (!isCustom && !symbol.includes(':')) ? `BINANCE:${symbol}USDT` : symbol;
                new window.TradingView.widget({ autosize: true, symbol: finalSymbol, interval: "D", timezone: "Asia/Bangkok", theme: "dark", style: "1", locale: "th_TH", enable_publishing: false, allow_symbol_change: true, container_id: containerId });
            }
        };
        if (!document.getElementById('tv-script')) {
            const s = document.createElement("script"); s.id = 'tv-script'; s.src = "https://s3.tradingview.com/tv.js"; s.async = true; s.onload = load; document.head.appendChild(s);
        } else { if (window.TradingView) load(); else { tvInterval = setInterval(() => { if (window.TradingView) { clearInterval(tvInterval); load(); } }, 200); } }
        return () => { if (tvInterval) clearInterval(tvInterval); };
    }, [symbol, isCustom]);
    return <div id={containerId} ref={containerRef} className="w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700" />;
}

export default function MarketTab({ selectedCoin, setSelectedCoin, coinSymbol, setCoinSymbol, isCustomSymbol, setIsCustomSymbol, coinInput, setCoinInput, coinImage, currentPrice, priceChange, marketStats, fearGreed, isMarketLoading, fetchPriceData, handleSearchCoin }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <form onSubmit={handleSearchCoin} className="relative flex-1">
                    <input type="text" placeholder="พิมพ์ชื่อเหรียญ (เช่น BTC, Ethereum) หรือ Symbol (NASDAQ:AAPL)..." value={coinInput} onChange={(e) => setCoinInput(e.target.value)} className={`w-full rounded-xl pl-12 pr-4 py-3 ${glassInput}`} />
                    <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                    <button type="submit" className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium">ค้นหา</button>
                </form>
                <div className="flex gap-2">
                    <button onClick={fetchPriceData} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${glassButton}`}>
                        <RefreshCw className={`w-4 h-4 ${isMarketLoading ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">รีเฟรช</span>
                    </button>
                    <div className={`flex p-1 rounded-xl overflow-x-auto ${glassPanel}`}>
                        {QUICK_COINS.map((coin) => (
                            <button key={coin.symbol} onClick={() => { if (coin.custom) { setIsCustomSymbol(true); setCoinSymbol(coin.custom.split(':')[1]); } else { setSelectedCoin(coin.id); setIsCustomSymbol(false); } }} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${coinSymbol === coin.symbol ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>{coin.symbol}</button>
                        ))}
                    </div>
                </div>
            </div>

            {!isCustomSymbol && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h2 className={`text-2xl font-bold text-white flex items-center gap-3 capitalize ${headingFont}`}>
                            {coinImage ? <img src={coinImage} className="w-8 h-8 rounded-full" alt={selectedCoin} /> : <Coins className="w-8 h-8 text-blue-500" />}
                            {selectedCoin} <span className="text-sm text-slate-500 font-normal">({coinSymbol})</span>
                        </h2>
                        <div className={`text-4xl font-bold text-white mt-2 ${headingFont}`}>${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</div>
                        <div className={`text-sm font-medium flex items-center gap-1 mt-1 ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}><TrendingUp className={`w-4 h-4 ${priceChange < 0 ? 'rotate-180' : ''}`}/>{priceChange.toFixed(2)}% (24h)</div>
                    </div>
                    <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl ${glassPanel}`}>
                        <div><p className="text-xs text-slate-500">Market Cap</p><p className="text-sm font-medium text-white">${formatNumber(marketStats.marketCap)}</p></div>
                        <div><p className="text-xs text-slate-500">Volume (24h)</p><p className="text-sm font-medium text-white">${formatNumber(marketStats.totalVolume)}</p></div>
                        <div><p className="text-xs text-slate-500">High (24h)</p><p className="text-sm font-medium text-emerald-400">${marketStats.high24h.toLocaleString()}</p></div>
                        <div><p className="text-xs text-slate-500">Low (24h)</p><p className="text-sm font-medium text-red-400">${marketStats.low24h.toLocaleString()}</p></div>
                    </div>
                </div>
            )}

            {!isCustomSymbol && (
                <div className={`flex items-center gap-4 p-3 rounded-xl ${glassPanel}`}>
                    <div className={`p-2 rounded-full ${fearGreed.value >= 70 ? 'bg-emerald-500/20 text-emerald-400' : fearGreed.value <= 30 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}><Gauge className="w-6 h-6" /></div>
                    <div><p className="text-xs text-slate-500">Fear & Greed Index</p><p className="text-sm font-bold text-white">{fearGreed.value} <span className="font-normal text-slate-400">({fearGreed.status})</span></p></div>
                </div>
            )}

            {isCustomSymbol && <div className={`pb-4 border-b border-slate-800 flex items-center gap-2 text-white font-bold text-xl ${headingFont}`}><Globe className="w-6 h-6 text-blue-400" />{coinSymbol} (TradingView Direct)</div>}

            <div className="w-full p-0.5 rounded-2xl bg-gradient-to-r from-[#F0B90B] to-[#F8D33A] shadow-lg shadow-yellow-500/10 group">
                <div className="bg-slate-950/95 backdrop-blur-md rounded-[14px] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-[#F0B90B] p-2.5 rounded-xl text-slate-900 shrink-0"><svg viewBox="0 0 32 32" className="w-8 h-8 fill-current"><path d="M16 0l6 6-6 6-6-6 6-6zM6 6l6 6-6 6-6-6 6-6zM26 6l6 6-6 6-6-6 6-6zM16 12l6 6-6 6-6-6 6-6zM6 18l6 6-6 6-6-6 6-6zM26 18l6 6-6 6-6-6 6-6zM16 24l6 6-6 6-6-6 6-6z"/></svg></div>
                        <div><h3 className={`text-lg font-bold text-white ${headingFont}`}>เทรดคริปโตอันดับ 1 กับ <span className="text-[#F0B90B]">Binance</span></h3><p className="text-sm text-slate-400">ค่าธรรมเนียมต่ำ ปลอดภัย รองรับภาษาไทย</p></div>
                    </div>
                    <a href="https://www.binance.com/en/register?ref=GRO_28502_6PQ0U" target="_blank" rel="noreferrer" className="bg-[#F0B90B] hover:bg-[#D9A507] text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 whitespace-nowrap">สมัครเลย <ExternalLink className="w-4 h-4"/></a>
                </div>
            </div>

            <TradingViewWidget symbol={coinSymbol} isCustom={isCustomSymbol} />
        </div>
    );
}
