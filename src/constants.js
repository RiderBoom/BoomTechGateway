// ─── Sandbox / Demo Mode ────────────────────────────────────────────────────
// true  = ระบบทดสอบ — ปิดการโอนเงินจริงทั้งหมด, แสดงแบนเนอร์คำเตือน
// false = Production — เปิดการโอนเงินจริง (เปลี่ยนเฉพาะเมื่อพร้อม Launch จริง)
export const SANDBOX_MODE = true;

export const SHOP_WALLET_ADDRESS = "0xCEEcd5Fe0034F397B5A66a7BcD754B5B08a6cd70";

// ─── EmailJS — ระบบแจ้งเตือนแอดมินทางอีเมล ────────────────────────────────
// ตั้งค่าที่ https://www.emailjs.com (Free: 200 emails/month)
// 1) สร้าง Email Service → คัดลอก Service ID
// 2) สร้าง Email Template → คัดลอก Template ID
// 3) Account → API Keys → คัดลอก Public Key
export const EMAILJS_CONFIG = {
    serviceId:  '',   // เช่น 'service_abc123'
    templateId: '',   // เช่น 'template_xyz789'
    publicKey:  '',   // เช่น 'AbCdEfGhIjKlMnOpQr'
};
export const ADMIN_EMAIL = 'boomzalnw2@gmail.com';
export const PROMPTPAY_ID = "0950524447";
export const USD_THB_RATE = 35.5;

// ค่าธรรมเนียมแพลตฟอร์ม (0 = ฟรี)
export const PLATFORM_FEE_PERCENT = 0;   // % ของจำนวนที่โอน
export const PLATFORM_FEE_FIXED_ETH = 0; // ETH คงที่ต่อรายการ

export const ADMIN_WALLETS = [
    "0x00F0903777B197CF673901b3cc768EA902fb601F",
];

// Firebase UID ที่มีสิทธิ์ Admin (เข้า Admin Panel โดยไม่ต้อง connect MetaMask)
export const ADMIN_FIREBASE_UIDS = [
    "oP8h9aHKUBMZSifpWzroPbFuoEb2",
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

export const CHAINS = {
    1: {
        name: "Ethereum", symbol: "ETH", shortName: "ETH",
        rpc: "https://eth.llamarpc.com", explorer: "https://etherscan.io",
        color: "text-blue-400", border: "border-blue-500/50", bg: "bg-blue-500/10",
        gradient: "from-blue-600 to-blue-800"
    },
    56: {
        name: "BNB Chain", symbol: "BNB", shortName: "BNB",
        rpc: "https://bsc-dataseed.binance.org", explorer: "https://bscscan.com",
        color: "text-yellow-400", border: "border-yellow-500/50", bg: "bg-yellow-500/10",
        gradient: "from-yellow-500 to-yellow-700"
    },
    137: {
        name: "Polygon", symbol: "POL", shortName: "MATIC",
        rpc: "https://polygon-rpc.com", explorer: "https://polygonscan.com",
        color: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-500/10",
        gradient: "from-purple-600 to-purple-800"
    },
    42161: {
        name: "Arbitrum", symbol: "ETH", shortName: "ARB",
        rpc: "https://arb1.arbitrum.io/rpc", explorer: "https://arbiscan.io",
        color: "text-sky-400", border: "border-sky-500/50", bg: "bg-sky-500/10",
        gradient: "from-sky-600 to-sky-800"
    },
    10: {
        name: "Optimism", symbol: "ETH", shortName: "OP",
        rpc: "https://mainnet.optimism.io", explorer: "https://optimistic.etherscan.io",
        color: "text-red-400", border: "border-red-500/50", bg: "bg-red-500/10",
        gradient: "from-red-600 to-red-800"
    },
    43114: {
        name: "Avalanche", symbol: "AVAX", shortName: "AVAX",
        rpc: "https://api.avax.network/ext/bc/C/rpc", explorer: "https://snowtrace.io",
        color: "text-red-300", border: "border-red-400/50", bg: "bg-red-400/10",
        gradient: "from-red-500 to-rose-700"
    },
    8453: {
        name: "Base", symbol: "ETH", shortName: "BASE",
        rpc: "https://mainnet.base.org", explorer: "https://basescan.org",
        color: "text-indigo-400", border: "border-indigo-500/50", bg: "bg-indigo-500/10",
        gradient: "from-indigo-600 to-indigo-800"
    },
};

export const QUICK_COINS = [
    { symbol: 'BTC',  id: 'bitcoin' },
    { symbol: 'ETH',  id: 'ethereum' },
    { symbol: 'BNB',  id: 'binancecoin' },
    { symbol: 'SOL',  id: 'solana' },
    { symbol: 'DOGE', id: 'dogecoin' },
    { symbol: 'XRP',  id: 'ripple' },
    { symbol: 'ADA',  id: 'cardano' },
];

export const INITIAL_PRODUCTS = [
    { id: 1, name: "BoomTech Hoodie", price: 0.035, category: "Merch", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=500&q=80" },
    { id: 2, name: "Hardware Wallet X", price: 0.08, category: "Gadget", image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=500&q=80" },
    { id: 3, name: "VIP Signal (1 Month)", price: 0.05, category: "Digital", image: "https://images.unsplash.com/photo-1611974765270-ca12586343bb?auto=format&fit=crop&w=500&q=80" },
    { id: 4, name: "Mining Rig Frame", price: 0.12, category: "Mining", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80" },
    { id: 5, name: "Trading Course", price: 0.02, category: "Digital", image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=500&q=80" },
    { id: 6, name: "NFT Art #888", price: 0.5, category: "NFT", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=500&q=80" }
];
