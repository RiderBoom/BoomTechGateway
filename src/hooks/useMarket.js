import { useState, useEffect } from 'react';

export function useMarket(activeTab) {
    const [selectedCoin, setSelectedCoin] = useState("ethereum");
    const [coinSymbol, setCoinSymbol] = useState("ETH");
    const [isCustomSymbol, setIsCustomSymbol] = useState(false);
    const [coinInput, setCoinInput] = useState("");
    const [coinImage, setCoinImage] = useState("https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880");
    const [currentPrice, setCurrentPrice] = useState(0);
    const [priceChange, setPriceChange] = useState(0);
    const [marketStats, setMarketStats] = useState({ marketCap: 0, totalVolume: 0, high24h: 0, low24h: 0, ath: 0 });
    const [fearGreed, setFearGreed] = useState({ value: 0, status: "Neutral" });
    const [isMarketLoading, setIsMarketLoading] = useState(false);

    const fetchPriceData = async () => {
        if (isCustomSymbol) return;
        setIsMarketLoading(true);
        try {
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${selectedCoin}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`);
            const data = await res.json();
            if (data[selectedCoin]) {
                setCurrentPrice(data[selectedCoin].usd);
                setPriceChange(data[selectedCoin].usd_24h_change);
                setMarketStats(prev => ({ ...prev, marketCap: data[selectedCoin].usd_market_cap, totalVolume: data[selectedCoin].usd_24h_vol }));
            }
            const detail = await fetch(`https://api.coingecko.com/api/v3/coins/${selectedCoin}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
            const detailData = await detail.json();
            if (detailData.symbol) {
                setCoinSymbol(detailData.symbol.toUpperCase());
                if (detailData.image?.large) setCoinImage(detailData.image.large);
                if (detailData.market_data) setMarketStats(prev => ({ ...prev, high24h: detailData.market_data.high_24h.usd, low24h: detailData.market_data.low_24h.usd, ath: detailData.market_data.ath.usd }));
            }
        } catch (e) { console.error("Price data error", e); }
        finally { setTimeout(() => setIsMarketLoading(false), 500); }
    };

    const fetchGlobalData = async () => {
        try {
            const res = await fetch("https://api.alternative.me/fng/?limit=1");
            const data = await res.json();
            if (data.data?.length > 0) setFearGreed({ value: parseInt(data.data[0].value), status: data.data[0].value_classification });
        } catch (e) {}
    };

    const handleSearchCoin = async (e) => {
        e.preventDefault();
        if (!coinInput.trim()) return;
        if (coinInput.includes(':') || !/^[a-zA-Z0-9]+$/.test(coinInput)) {
            setCoinSymbol(coinInput.toUpperCase()); setIsCustomSymbol(true); setCoinInput(""); return;
        }
        try {
            const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${coinInput}`);
            const data = await res.json();
            if (data.coins?.length > 0) { setSelectedCoin(data.coins[0].id); setIsCustomSymbol(false); setCoinInput(""); }
            else { setCoinSymbol(coinInput.toUpperCase()); setIsCustomSymbol(true); setCoinInput(""); }
        } catch { setCoinSymbol(coinInput.toUpperCase()); setIsCustomSymbol(true); setCoinInput(""); }
    };

    useEffect(() => {
        if (activeTab !== 'market') return;
        fetchGlobalData();
        if (!isCustomSymbol) {
            fetchPriceData();
            const interval = setInterval(fetchPriceData, 30000);
            return () => clearInterval(interval);
        }
    }, [activeTab, selectedCoin, isCustomSymbol]);

    return {
        selectedCoin, setSelectedCoin, coinSymbol, setCoinSymbol,
        isCustomSymbol, setIsCustomSymbol, coinInput, setCoinInput,
        coinImage, currentPrice, priceChange, marketStats, fearGreed,
        isMarketLoading, fetchPriceData, handleSearchCoin
    };
}
