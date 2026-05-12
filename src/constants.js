export const DEFAULT_CONTRACT_ADDRESS = "0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B";
export const SHOP_WALLET_ADDRESS = "0x32827b005cda325C2da1c290e303D860aFeceFfe";
export const PROMPTPAY_ID = "0950524447";
export const USD_THB_RATE = 35.5;

export const ADMIN_WALLETS = [
    "0x32827b005cda325C2da1c290e303D860aFeceFfe",
];

export const CONTRACT_ABI = [
    "function transferETHWithReferral(address payable to, address referrer) external payable",
    "function transferTokenWithReferral(address token, address to, uint256 amount, address referrer) external",
    "function donateETH() external payable",
    "function donateToken(address token, uint256 amount) external",
    "function owner() view returns (address)",
    "function setFeeBps(uint256 newFeeBps) external",
    "function setTreasury(address newTreasury) external",
    "function feeBps() view returns (uint256)",
    "function rescueETH(uint256 amount) external"
];

export const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
];

export const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDqbllQ68zYTPag1UdjM2klTEBDd43wDAk",
    authDomain: "boomwallet-2583b.firebaseapp.com",
    projectId: "boomwallet-2583b",
    storageBucket: "boomwallet-2583b.firebasestorage.app",
    messagingSenderId: "1032978734418",
    appId: "1:1032978734418:web:50605af806581bf4a86e8b"
};

export const QUICK_COINS = [
    { symbol: 'BTC', id: 'bitcoin' },
    { symbol: 'ETH', id: 'ethereum' },
    { symbol: 'BNB', id: 'binancecoin' },
    { symbol: 'SOL', id: 'solana' },
    { symbol: 'DOGE', id: 'dogecoin' },
    { symbol: 'GOLD', custom: 'OANDA:XAUUSD' },
    { symbol: 'AAPL', custom: 'NASDAQ:AAPL' }
];

export const INITIAL_PRODUCTS = [
    { id: 1, name: "BoomTech Hoodie", price: 0.035, category: "Merch", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=500&q=80" },
    { id: 2, name: "Hardware Wallet X", price: 0.08, category: "Gadget", image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=500&q=80" },
    { id: 3, name: "VIP Signal (1 Month)", price: 0.05, category: "Digital", image: "https://images.unsplash.com/photo-1611974765270-ca12586343bb?auto=format&fit=crop&w=500&q=80" },
    { id: 4, name: "Mining Rig Frame", price: 0.12, category: "Mining", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80" },
    { id: 5, name: "Trading Course", price: 0.02, category: "Digital", image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=500&q=80" },
    { id: 6, name: "NFT Art #888", price: 0.5, category: "NFT", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=500&q=80" }
];
