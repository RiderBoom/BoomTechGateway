import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, ArrowRightLeft, Heart, Settings, Shield, RefreshCw, Copy, Check, 
  AlertTriangle, Users, QrCode, TrendingUp, Search, Coins, LineChart, 
  BarChart2, Globe, Activity, DollarSign, BarChart4, Gauge, LogOut, 
  Newspaper, Clock, ExternalLink, MessageSquare, Send, Image as ImageIcon, X,
  ShoppingBag, ShoppingCart, CreditCard, Package, Plus, Minus, Trash2, Smartphone,
  Bot, Sparkles, Zap, MessageCircle, History, Bell, Box, Edit2, Save, Lock,
  Gamepad2, Trophy, Rocket, Gem, Gift, Brain, HelpCircle, 
  Egg, Utensils, Moon, Sun, Smile, Flame, 
  LogIn, UserPlus, Mail, User, Crown, CloudUpload, Database, Star, ThumbsUp,
  Menu, XCircle, ChevronRight, Network, Wifi, TrendingDown, Info, Upload, FileText, CheckCircle, XCircle as XCircleIcon,
  Languages, Link as LinkIcon
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  GoogleAuthProvider,     
  signInWithPopup,        
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,                
  updateProfile           
} from 'firebase/auth'; 
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, where, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const App = () => {
  // --- Configuration (PRODUCTION SETTINGS) ---
  const DEFAULT_CONTRACT_ADDRESS = "0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B"; 
  
  // 💰 กระเป๋า Admin หลัก (รับเงินค่าของ + บริจาค + ค่าธรรมเนียม)
  // ⚠️ กรุณาแก้ไขเป็น Wallet ของคุณ
  const SHOP_WALLET_ADDRESS = "0xCEEcd5Fe0034F397B5A66a7BcD754B5B08a6cd70"; 
  
  // 📱 เบอร์พร้อมเพย์ หรือ เลขบัตรประชาชน (สำหรับรับเงินบาท)
  // ⚠️ กรุณาแก้ไขเป็นของคุณ
  const PROMPTPAY_ID = "0950524447"; 
  
  // 🛡️ ADMIN LIST (ผู้มีอำนาจสูงสุด)
  // ⚠️ ใส่ Wallet Address ของคุณที่นี่ (ตัวพิมพ์เล็กทั้งหมด)
  // เฉพาะกระเป๋าในนี้เท่านั้นที่จะเห็นเมนู Admin และจัดการสินค้าได้
  const ADMIN_WALLETS = [
      "0xCEEcd5Fe0034F397B5A66a7BcD754B5B08a6cd70", 
      // "0x...กระเป๋าสำรอง...", 
  ];
  
  // 🤖 AI Config
  // ใส่ Gemini API Key ที่นี่เพื่อให้บอททำงาน (ถ้าไม่มี เว้นว่างไว้ได้)
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

  // ✅ Supported Networks Configuration
  const NETWORKS = {
    "0x1": { 
        chainId: "0x1", name: "Ethereum", symbol: "ETH", color: "text-indigo-400", bg: "bg-indigo-500/20", border: "border-indigo-500/50",
        rpc: ["https://mainnet.infura.io/v3/"],
        usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7" // ETH USDT
    },
    "0x38": { 
        chainId: "0x38", name: "BSC Smart Chain", symbol: "BNB", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/50",
        usdt: "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
        params: {
            chainId: '0x38',
            chainName: 'Binance Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com']
        }
    },
    "0x89": { 
        chainId: "0x89", name: "Polygon", symbol: "MATIC", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/50",
        usdt: "0xc2132D6b031989f9a41b538f08db0521db774678", // Polygon USDT
        params: {
            chainId: '0x89',
            chainName: 'Polygon Mainnet',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com/'],
            blockExplorerUrls: ['https://polygonscan.com']
        }
    },
    "0x60": { 
        chainId: "0x60", name: "Bitkub Chain", symbol: "KUB", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/50",
        usdt: "", // KUB USDT (Check explorer)
        params: {
            chainId: '0x60',
            chainName: 'Bitkub Chain',
            nativeCurrency: { name: 'KUB', symbol: 'KUB', decimals: 18 },
            rpcUrls: ['https://rpc.bitkubchain.io'],
            blockExplorerUrls: ['https://bkcscan.com']
        }
    },
  };

  // ✅ TRANSLATIONS OBJECT
  const TRANSLATIONS = {
      EN: {
        tabs: { wallet: "Wallet", market: "Market", game: "BoomPet", shop: "Shop", news: "News", community: "Community", donate: "Donate", admin: "Admin" },
        header: { connect: "Connect Wallet", login: "Login", online: "Online", welcome: "Welcome Back", createAcc: "Create Account" },
        wallet: { send: "Send", receive: "Receive", native: "Native", token: "Token", tokenAddr: "Token Address", recipient: "Recipient Address", amount: "Amount", confirm: "Confirm Transfer", recent: "Recent Activity", noTx: "No transactions yet", yourAddr: "Your Wallet Address", selectChain: "Select Chain Network" },
        market: { search: "Search Symbol...", refresh: "Refresh", price: "Price", mcap: "Market Cap", vol: "Volume 24h", fear: "Fear & Greed", ath: "All-Time High", atl: "All-Time Low", supply: "Circulating Supply", fdv: "FDV (Valuation)", binanceTitle: "Trade on Binance", binanceDesc: "Save 20% on fees with referral ID:" },
        game: { title: "BOOM PET", subtitle: "Raise your digital companion", feed: "Feed", train: "Train", sleep: "Sleep", wake: "Wake" },
        shop: { title: "Marketplace", subtitle: "Exclusive Gear & Digital Assets", seller: "Seller Dashboard", loadDemo: "Load Demo Data", exit: "Exit Mode", manage: "Manage Products", edit: "Edit Item", add: "Add New Item", name: "Product Name", cat: "Category", img: "Image URL", cancel: "Cancel", update: "Update Item", create: "Create Item", inventory: "Inventory", recentOrders: "Recent Orders", buyer: "Buyer", paid: "Paid", pending: "Pending Slip", rejected: "Rejected", viewSlip: "View Slip", approve: "Approve", reject: "Reject", shipping: "Shipping", cart: "Your Cart", emptyCart: "Your cart is empty", shipTo: "Shipping To", payMethod: "Payment Method", total: "Total Estimate", checkout: "Complete Purchase", processing: "Processing...", usdtAddr: "USDT Contract Address" },
        news: { title: "Official News", loading: "Loading feeds...", read: "Read More", updated: "Last updated", postNews: "Post News", newsTitle: "Title", newsDesc: "Description/Body", newsLink: "Source Link", newsSource: "Source Name" },
        community: { title: "Live Community", typeMsg: "Type something..." },
        donate: { title: "Support Development", desc: "Your contribution helps us build the future of BoomTech.", confirm: "Confirm Donation" },
        admin: { title: "Restricted Area", desc: "Only authorized contract owners.", updateFee: "Update Protocol Fee (BPS)", changeTreasury: "Change Treasury Address", update: "Update" },
        auth: { displayName: "Display Name", email: "Email", password: "Password", signIn: "Sign In", signUp: "Sign Up", newHere: "New here?", haveAcc: "Already have an account?" }
      },
      TH: {
        tabs: { wallet: "กระเป๋าเงิน", market: "ตลาด", game: "สัตว์เลี้ยง", shop: "ร้านค้า", news: "ข่าวสาร", community: "ชุมชน", donate: "บริจาค", admin: "ผู้ดูแล" },
        header: { connect: "เชื่อมต่อกระเป๋า", login: "เข้าสู่ระบบ", online: "ออนไลน์", welcome: "ยินดีต้อนรับกลับ", createAcc: "สร้างบัญชีใหม่" },
        wallet: { send: "โอนเงิน", receive: "รับเงิน", native: "เหรียญหลัก", token: "โทเคน", tokenAddr: "ที่อยู่โทเคน", recipient: "ที่อยู่ผู้รับ", amount: "จำนวน", confirm: "ยืนยันการโอน", recent: "ประวัติล่าสุด", noTx: "ยังไม่มีรายการ", yourAddr: "ที่อยู่กระเป๋าของคุณ", selectChain: "เลือกเครือข่าย" },
        market: { search: "ค้นหาเหรียญ...", refresh: "รีเฟรช", price: "ราคา", mcap: "มูลค่าตลาด", vol: "ปริมาณ 24ชม.", fear: "ดัชนีกลัว/โลภ", ath: "ราคาสูงสุด", atl: "ราคาต่ำสุด", supply: "อุปทานหมุนเวียน", fdv: "มูลค่าประเมิน (FDV)", binanceTitle: "เทรดบน Binance", binanceDesc: "รับส่วนลดค่าธรรมเนียม 20% ด้วยรหัส:" },
        game: { title: "BOOM PET", subtitle: "เลี้ยงมอนสเตอร์ดิจิทัลของคุณ", feed: "ให้อาหาร", train: "ฝึกฝน", sleep: "เข้านอน", wake: "ตื่นนอน" },
        shop: { title: "ตลาดซื้อขาย", subtitle: "อุปกรณ์และสินทรัพย์ดิจิทัล", seller: "แผงควบคุมผู้ขาย", loadDemo: "โหลดข้อมูลตัวอย่าง", exit: "ออก", manage: "จัดการสินค้า", edit: "แก้ไขสินค้า", add: "เพิ่มสินค้าใหม่", name: "ชื่อสินค้า", cat: "หมวดหมู่", img: "ลิ้งค์รูปภาพ", cancel: "ยกเลิก", update: "อัปเดต", create: "สร้าง", inventory: "คลังสินค้า", recentOrders: "คำสั่งซื้อล่าสุด", buyer: "ผู้ซื้อ", paid: "จ่ายแล้ว", pending: "รอตรวจสอบสลิป", rejected: "ปฏิเสธ", viewSlip: "ดูสลิป", approve: "อนุมัติ", reject: "ปฏิเสธ", shipping: "ที่อยู่จัดส่ง", cart: "ตะกร้าสินค้า", emptyCart: "ตะกร้าว่างเปล่า", shipTo: "ที่อยู่จัดส่ง", payMethod: "วิธีการชำระเงิน", total: "ยอดรวมโดยประมาณ", checkout: "ยืนยันการสั่งซื้อ", processing: "กำลังดำเนินการ...", usdtAddr: "ที่อยู่สัญญา USDT" },
        news: { title: "ข่าวสารทางการ", loading: "ยังไม่มีข่าวสาร", read: "อ่านต่อ", postNews: "โพสต์ข่าว", newsTitle: "หัวข้อข่าว", newsDesc: "เนื้อหาข่าว", newsLink: "ลิงก์ที่มา", newsSource: "ชื่อสำนักข่าว" },
        community: { title: "ชุมชนสด", typeMsg: "พิมพ์ข้อความ..." },
        donate: { title: "สนับสนุนนักพัฒนา", desc: "การสนับสนุนของคุณช่วยให้เราพัฒนา BoomTech ต่อไปได้", confirm: "ยืนยันการบริจาค" },
        admin: { title: "เขตหวงห้าม", desc: "เฉพาะเจ้าของสัญญาที่ได้รับอนุญาตเท่านั้น", updateFee: "อัปเดตค่าธรรมเนียม (BPS)", changeTreasury: "เปลี่ยนกระเป๋ากองคลัง", update: "อัปเดต" },
        auth: { displayName: "ชื่อที่แสดง", email: "อีเมล", password: "รหัสผ่าน", signIn: "เข้าสู่ระบบ", signUp: "สมัครสมาชิก", newHere: "เพิ่งเคยมาที่นี่?", haveAcc: "มีบัญชีอยู่แล้ว?" }
      }
  };

  // --- Firebase Setup ---
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [db, setDb] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authInstance, setAuthInstance] = useState(null);
  const [dbError, setDbError] = useState(null);
  const [storage, setStorage] = useState(null);
  
  // --- Auth UI State ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(""); 
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [appReviews, setAppReviews] = useState([]); // Kept variable but unused in view as requested
  
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  
  // --- State ---
  const [ethersLib, setEthersLib] = useState(null); 
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0.0000"); 
  const [tokenBalance, setTokenBalance] = useState("0.00");
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [activeTab, setActiveTab] = useState("shop"); 
  
  // ✅ New: Language State
  const [lang, setLang] = useState('TH'); // Default to Thai
  const t = TRANSLATIONS[lang]; // Shortcut for translation

  // ✅ New: Network State
  const [chainId, setChainId] = useState(null);
  const [nativeTicker, setNativeTicker] = useState("ETH");
  const [networkName, setNetworkName] = useState("Unknown Network");

  // Wallet Tab State
  const [walletMode, setWalletMode] = useState("transfer"); 

  // Form Data
  const [transferType, setTransferType] = useState("NATIVE"); 
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [donateType, setDonateType] = useState("NATIVE");
  const [donateTokenAddress, setDonateTokenAddress] = useState("");
  
  // Shop State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("PROMPTPAY"); 
  const [usdtAddress, setUsdtAddress] = useState(""); 
  const [isSellerMode, setIsSellerMode] = useState(false); 
  const [shopOrders, setShopOrders] = useState([]); 
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState(null);
  
  // ✅ New: Rate for USDT/THB
  const [usdtThbRate, setUsdtThbRate] = useState(34.5); // Default fallback rate

  // New Product State
  const [newProduct, setNewProduct] = useState({ name: "", price: "", category: "Merch", image: "" });
  const [editingProductId, setEditingProductId] = useState(null);
  const [products, setProducts] = useState([]);
  const [shippingAddress, setShippingAddress] = useState("");

  // --- Game State (BoomPet) ---
  const [gameScore, setGameScore] = useState(1000); 
  const [pet, setPet] = useState({
      name: "Egg",
      stage: "egg", 
      hunger: 100, 
      energy: 100, 
      happiness: 100, 
      exp: 0,
      age: 0,
      isSleeping: false,
      lastTick: Date.now()
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const PET_STAGES = {
      egg: { index: 0, name: "DigiEgg", icon: Egg, color: "text-slate-400", next: "baby", reqExp: 10 },
      baby: { index: 1, name: "Botamon", icon: Smile, color: "text-pink-400", next: "rookie", reqExp: 100 },
      rookie: { index: 2, name: "Agumon", icon: Flame, color: "text-orange-500", next: "champion", reqExp: 300 },
      champion: { index: 3, name: "Greymon", icon: Zap, color: "text-blue-500", next: "ultimate", reqExp: 800 },
      ultimate: { index: 4, name: "WarGreymon", icon: Trophy, color: "text-yellow-400", next: null, reqExp: 9999 }
  };

  // --- AI Chatbot State ---
  const [isAiChatOpen, setIsAiChatOpen] = useState(false); 
  const [aiMessages, setAiMessages] = useState([
    { id: 1, sender: 'bot', text: 'สวัสดีครับ! ผมคือ BoomBot AI (Powered by Gemini) 🤖 ผู้ช่วยอัจฉริยะของคุณ ถามเรื่องราคาเหรียญ หรือความรู้ Crypto ได้เลยครับ!' }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const aiChatEndRef = useRef(null);

  // Status & UI
  const [isLoading, setIsLoading] = useState(false);
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState("info");
  const [isOwner, setIsOwner] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const slipInputRef = useRef(null); 

  // Market Data
  const [selectedCoin, setSelectedCoin] = useState("ethereum"); 
  const [coinSymbol, setCoinSymbol] = useState("ETH"); 
  const [isCustomSymbol, setIsCustomSymbol] = useState(false);
  const [coinInput, setCoinInput] = useState("");
  const [coinImage, setCoinImage] = useState("https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [marketStats, setMarketStats] = useState({ 
      marketCap: 0, totalVolume: 0, high24h: 0, low24h: 0, ath: 0, athChange: 0, atl: 0, atlChange: 0, circulatingSupply: 0, totalSupply: 0, maxSupply: 0, fdv: 0
  });
  const [fearGreed, setFearGreed] = useState({ value: 0, status: "Neutral" });

  // ✅ New: News Data State
  const [adminNews, setAdminNews] = useState([]); // Manual news
  const [newsData, setNewsData] = useState([]); // API news
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newNews, setNewNews] = useState({ title: "", body: "", imageurl: "", url: "", source: "Admin" });

  // Admin
  const [newFee, setNewFee] = useState("");
  const [newTreasury, setNewTreasury] = useState("");

  // --- Modern Design Constants ---
  const glassPanel = "bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]";
  const glassButton = "bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/10 backdrop-blur-md transition-all active:scale-95 text-slate-100 shadow-lg shadow-black/20";
  const glassInput = "bg-slate-950/60 border border-white/5 focus:border-indigo-500/50 focus:bg-slate-900/80 outline-none transition-all text-slate-200 placeholder-slate-500 shadow-inner";
  const headingFont = "font-['Sora'] tracking-tight";
  const bodyFont = "font-['Outfit']";
  const accentGradient = "bg-gradient-to-r from-violet-500 to-fuchsia-500";
  const textGradient = "bg-gradient-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent";

  const contractABI = [
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

  const erc20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
  ];

  // --- Initialize Firebase ---
  useEffect(() => {
    try {
      let config;
      if (typeof __firebase_config !== 'undefined') {
        config = JSON.parse(__firebase_config);
      } else {
        config = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID
        };
      }

      if (!config) return;

      const app = initializeApp(config);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);
      const storageInstance = getStorage(app);

      setFirebaseApp(app);
      setAuthInstance(authInstance);
      setDb(dbInstance);
      setStorage(storageInstance);

      // ✅ FIX: Ensure Anonymous Auth if no token
      const initAuth = async () => {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(authInstance, __initial_auth_token);
            } else {
                await signInAnonymously(authInstance);
            }
      };

      initAuth().catch(err => {
          console.error("Auth failed", err);
          setDbError("Authentication failed: " + err.code);
      });
      
      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        setFirebaseUser(user);
        if (user && !user.isAnonymous) {
            setShowAuthModal(false);
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase init error", e);
      setDbError("Firebase Init Error: " + e.message);
    }
  }, []);
  
  // --- Dynamic Title & Favicon ---
  useEffect(() => {
      document.title = "BoomTech SuperApp";
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/svg+xml';
      link.rel = 'shortcut icon';
      link.href = `data:image/svg+xml;base64,${btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
              <defs>
                  <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#22d3ee" />
                      <stop offset="100%" stop-color="#d946ef" />
                  </linearGradient>
              </defs>
              <path d="M32 4 L60 20 L60 44 L32 60 L4 44 L4 20 Z" stroke="url(#logo-grad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="#0f172a"/>
              <path d="M32 32 L60 20 M32 32 L4 20 M32 32 L32 60" stroke="url(#logo-grad)" stroke-width="4" stroke-linecap="round" opacity="0.8"/>
          </svg>
      `)}`;
      document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  // --- Auth Functions ---
  const isLoggedIn = () => (firebaseUser && !firebaseUser.isAnonymous) || account;
  
  const getUserDisplayName = () => {
      if (firebaseUser && !firebaseUser.isAnonymous) {
          return firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : "User");
      }
      if (account) return `${account.slice(0, 6)}...${account.slice(-4)}`;
      return "Guest";
  };
  
  // ✅ New: Ensure Auth Helper with Retry Logic
  const ensureAuth = async () => {
    if (!authInstance) return false;
    // Force re-auth if current user is null or if there's a suspicion of stale session
    if (!authInstance.currentUser) {
      try {
        console.log("No user, signing in anonymously...");
        await signInAnonymously(authInstance);
        return true;
      } catch (error) {
        console.error("Anonymous auth failed:", error);
        return false;
      }
    }
    return true;
  };

  const handleGoogleLogin = async () => {
      if (!authInstance) return;
      setAuthLoading(true);
      try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(authInstance, provider);
          showStatus("เข้าสู่ระบบด้วย Google สำเร็จ! 🎉", "success");
      } catch (error) {
          console.error(error);
          setAuthError("Google Login Failed: " + error.message);
      } finally {
          setAuthLoading(false);
      }
  };

  const handleEmailAuth = async (e) => {
      e.preventDefault();
      if (!authInstance) return;
      setAuthLoading(true);
      setAuthError("");
      try {
          if (authMode === 'signup') {
              const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
              if (displayName) {
                  await updateProfile(userCredential.user, { displayName });
              }
              showStatus("สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ " + displayName, "success");
          } else {
              await signInWithEmailAndPassword(authInstance, email, password);
              showStatus("เข้าสู่ระบบสำเร็จ! ✅", "success");
          }
      } catch (error) {
          console.error(error);
          let msg = error.message;
          if (error.code === 'auth/operation-not-allowed') msg = "กรุณาเปิดใช้งาน Email/Password Login ใน Firebase Console";
          else if (error.code === 'auth/email-already-in-use') msg = "อีเมลนี้มีผู้ใช้งานแล้ว";
          else if (error.code === 'auth/weak-password') msg = "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
          else if (error.code === 'auth/invalid-email') msg = "รูปแบบอีเมลไม่ถูกต้อง";
          else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') msg = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
          setAuthError(msg);
      } finally {
          setAuthLoading(false);
      }
  };

  const handleLogout = async () => {
      if (!authInstance) return;
      try {
          await signOut(authInstance);
          setAccount("");
          showStatus("ออกจากระบบแล้ว 👋", "info");
          await signInAnonymously(authInstance);
      } catch (error) {
          console.error(error);
      }
  };

  // --- Real-time Listeners ---
  useEffect(() => {
    if (!db || !appId || !firebaseUser) return;
    setDbError(null); 

    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'community_chat');
    const unsubChat = onSnapshot(chatRef, (snapshot) => {
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000; 
      const cutoffTime = Date.now() - TWENTY_FOUR_HOURS_MS;
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(msg => msg.timestamp > cutoffTime); 
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      setChatMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    const txRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    const unsubTx = onSnapshot(txRef, (snapshot) => {
        const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        txs.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(txs.slice(0, 10)); 
        const orders = txs.filter(t => t.type === 'SHOP_BUY' || t.type === 'SHOP_BUY_QR' || t.type === 'SHOP_BUY_USDT'); // ✅ Include USDT orders
        setShopOrders(orders);
    });

    const productRef = collection(db, 'artifacts', appId, 'public', 'data', 'shop_products');
    const unsubProducts = onSnapshot(productRef, (snapshot) => {
        const loadedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loadedProducts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setProducts(loadedProducts);
    });

    // ✅ New: Admin News Listener (Only Manual Posts)
    const newsRef = collection(db, 'artifacts', appId, 'public', 'data', 'news_posts');
    const unsubNews = onSnapshot(newsRef, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        posts.sort((a, b) => b.published_on - a.published_on);
        setAdminNews(posts);
    });

    return () => {
        unsubChat();
        unsubTx();
        unsubProducts();
        unsubNews();
    };
  }, [db, appId, firebaseUser]); 

  // --- Game Loop Implementation ---
  useEffect(() => {
    // Only run game loop if in Game tab and authenticated
    if (activeTab !== 'game' || !isLoggedIn()) return;

    const interval = setInterval(() => {
        setPet(prev => {
            if (prev.stage === 'egg') return prev; // Eggs don't change stats

            let next = { ...prev };
            
            if (prev.isSleeping) {
                // Sleeping: Recover Energy, Hunger drops slower
                next.energy = Math.min(100, prev.energy + 5);
                next.hunger = Math.max(0, prev.hunger - 1);
            } else {
                // Awake: Stats decay
                next.hunger = Math.max(0, prev.hunger - 2);
                next.happiness = Math.max(0, prev.happiness - 1);
                next.energy = Math.max(0, prev.energy - 1);
            }

            // Auto-wake if energy full? Optional.
            if (next.isSleeping && next.energy >= 100) {
                next.isSleeping = false;
                showStatus("Pet woke up fully rested!", "success");
            }

            return next;
        });
    }, 3000); // Tick every 3 seconds

    return () => clearInterval(interval);
  }, [activeTab, firebaseUser]); // Depend on user presence

  // --- Save Game Data ---
  const saveGameData = async (currentPet, currentScore) => {
      if (!db || !firebaseUser) return;
      try {
          // Saving to user's private data path
          await setDoc(doc(db, 'artifacts', appId, 'users', firebaseUser.uid, 'game_data', 'boom_pet'), {
              pet: currentPet,
              score: currentScore,
              lastSaved: Date.now()
          }, { merge: true });
          
          // Also update public leaderboard
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard', firebaseUser.uid), {
              name: getUserDisplayName(),
              score: currentScore,
              petStage: currentPet.stage
          }, { merge: true });
          
          setIsSaving(false);
      } catch (e) {
          console.error("Save failed", e);
          setIsSaving(false);
      }
  };

  // Auto-save effect
  useEffect(() => {
      if (activeTab !== 'game' || !isLoggedIn()) return;
      
      const saveInterval = setInterval(() => {
          setIsSaving(true);
          saveGameData(pet, gameScore);
      }, 30000); // Auto save every 30s
      
      return () => clearInterval(saveInterval);
  }, [pet, gameScore, activeTab]);


  // --- Wallet & Ethers ---
  useEffect(() => {
    const initEthers = async () => {
      if (typeof ethers !== 'undefined') { setEthersLib(ethers); return; }
      if (window.ethers) { setEthersLib(window.ethers); } 
      else {
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js";
        script.async = true;
        script.onload = () => { if (window.ethers) setEthersLib(window.ethers); };
        document.body.appendChild(script);
      }
    };
    initEthers();
  }, []);

  useEffect(() => {
    if (window.ethereum && ethersLib) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
          if (accounts.length > 0) connectWallet();
      });
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) { setAccount(accounts[0]); window.location.reload(); } 
        else { setAccount(""); setSigner(null); setBalance("0.0000"); }
      });
      // ✅ Handle Chain Changed
      window.ethereum.on('chainChanged', (newChainId) => {
          window.location.reload(); 
      });
    }
  }, [ethersLib]);

  useEffect(() => {
      if (!account || !provider || !ethersLib) return;
      const interval = setInterval(async () => {
          try {
              const rawBalance = await provider.getBalance(account);
              const ethBalance = ethersLib.utils.formatEther(rawBalance);
              setBalance(parseFloat(ethBalance).toFixed(4));
          } catch (e) { console.error("Balance polling error", e); }
      }, 15000); 
      return () => clearInterval(interval);
  }, [account, provider, ethersLib]);

  // ✅ Updated Connect Wallet to detect Network
  const connectWallet = async () => {
    let walletProvider = window.ethereum;
    if (!walletProvider && window.BinanceChain) walletProvider = window.BinanceChain;
    if (!walletProvider) return alert("ไม่พบกระเป๋าเงิน! กรุณาติดตั้ง MetaMask หรือ Binance Wallet");
    if (!ethersLib) return showStatus("กำลังโหลดระบบ...", "info");
    
    try {
      const provider = new ethersLib.providers.Web3Provider(walletProvider);
      if (walletProvider.request) await walletProvider.request({ method: 'eth_requestAccounts' });
      else await provider.send("eth_requestAccounts", []);

      const signer = provider.getSigner();
      const addr = await signer.getAddress();
      const rawBalance = await provider.getBalance(addr);
      
      // ✅ Get Chain ID
      const hexChainId = await walletProvider.request({ method: 'eth_chainId' });
      const currentNetwork = NETWORKS[hexChainId] || { name: "Unknown Network", symbol: "ETH", color: "text-slate-400" };
      
      setChainId(hexChainId);
      setNativeTicker(currentNetwork.symbol);
      setNetworkName(currentNetwork.name);
      
      // ✅ Auto-set USDT Address if known
      if (currentNetwork.usdt) {
          setUsdtAddress(currentNetwork.usdt);
      }
      
      setProvider(provider);
      setSigner(signer);
      setAccount(addr);
      setBalance(parseFloat(ethersLib.utils.formatEther(rawBalance)).toFixed(4));
      
      checkOwner(addr);
      showStatus(`Connected to ${currentNetwork.name}`, "success");

    } catch (err) { 
        console.error(err);
        showStatus("เชื่อมต่อล้มเหลว: " + (err.message || err), "error"); 
    }
  };
  
  // ✅ New: Real-time Exchange Rate Fetcher (THB/USDT)
  const fetchExchangeRates = async () => {
      try {
          const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=thb");
          const data = await res.json();
          if (data.tether && data.tether.thb) {
              setUsdtThbRate(data.tether.thb);
          }
      } catch (e) { console.error("Rate fetch error", e); }
  };
  
  // ✅ Fetch rate on load & periodically
  useEffect(() => {
      fetchExchangeRates();
      const interval = setInterval(fetchExchangeRates, 60000); // Update every minute
      return () => clearInterval(interval);
  }, []);

  // ✅ New Function: Handle Network Switch
  const handleSwitchNetwork = async (targetChainId) => {
      if (!window.ethereum) return showStatus("กรุณาติดตั้ง Wallet", "error");
      try {
          await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetChainId }],
          });
          // Note: The window will reload due to the 'chainChanged' listener in useEffect
      } catch (switchError) {
          // This error code 4902 means the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
              const network = NETWORKS[targetChainId];
              if(network && network.params) {
                  try {
                      await window.ethereum.request({
                          method: 'wallet_addEthereumChain',
                          params: [network.params],
                      });
                  } catch (addError) {
                      showStatus("ไม่สามารถเพิ่มเครือข่ายได้", "error");
                  }
              } else {
                   showStatus("ไม่พบข้อมูลเครือข่ายสำหรับเพิ่มอัตโนมัติ", "error");
              }
          } else {
              showStatus("การสลับเครือข่ายล้มเหลว", "error");
          }
      }
  };

  // 🛡️ SECURITY CHECK: ตรวจสอบความเป็นเจ้าของจาก List ที่ Hardcode เท่านั้น
  const checkOwner = async (addr) => {
    const currentAddr = addr.toLowerCase().trim();
    // ⚠️ CRITICAL: ตรวจสอบเฉพาะ ADMIN_WALLETS เท่านั้น ไม่สนใจ owner() จาก Contract
    // ทำให้เจ้าของ Contract ที่ไม่ได้อยู่ใน List นี้ ไม่มีสิทธิ์เข้าถึงหน้า Admin
    const isAdminWallet = ADMIN_WALLETS.some(admin => admin.toLowerCase().trim() === currentAddr);
    setIsOwner(isAdminWallet);
  };

  const showStatus = (msg, type = "info") => {
    const safeMsg = typeof msg === 'object' ? JSON.stringify(msg) : String(msg);
    setStatusMsg(safeMsg);
    setStatusType(type);
    if (type === "success") setTimeout(() => setStatusMsg(""), 5000);
  };

  const recordTransaction = async (type, amount, token, to, details = "", shippingAddress = null, slip = null) => {
      if (!db || !appId || !firebaseUser) return; 
      try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), {
              type, amount, token, to, details, shippingAddress, 
              from: account || getUserDisplayName(),
              timestamp: Date.now(),
              status: type === 'SHOP_BUY_QR' ? 'pending' : 'paid', // ✅ Default pending for QR
              slip: slip
          });
      } catch (e) { console.error("Log tx error", e); }
  };

  // 💰 HARDCODED RECIPIENT: ฟังก์ชันนี้บังคับให้ส่งเงินไปที่ Admin Wallet เสมอ
  const getRecipientAddress = () => {
      // 1. Priority: ตรวจสอบ SHOP_WALLET_ADDRESS ที่ตั้งค่าไว้ข้างบนสุด
      if (ethersLib.utils.isAddress(SHOP_WALLET_ADDRESS)) return SHOP_WALLET_ADDRESS;
      // 2. Fallback: ถ้าไม่มีให้ใช้คนแรกใน ADMIN_WALLETS
      if (ADMIN_WALLETS.length > 0 && ethersLib.utils.isAddress(ADMIN_WALLETS[0])) return ADMIN_WALLETS[0];
      // 3. Last Resort: (ไม่ควรเกิดขึ้น)
      return "0x000000000000000000000000000000000000dEaD"; 
  };

  const handleTransfer = async () => {
    if (!contractAddress) return showStatus("กรุณาระบุ Contract Address", "error");
    if (!recipient || !amount) return showStatus("กรุณากรอกข้อมูลให้ครบ", "error");
    if (!ethersLib) return;
    setIsLoading(true);
    showStatus("กำลังดำเนินการ...", "info");
    try {
      const contract = new ethersLib.Contract(contractAddress, contractABI, signer);
      // 🔒 SECURITY: บังคับค่า Referrer ให้เป็นกระเป๋า Admin เสมอ
      // ผู้ใช้หน้าเว็บไม่สามารถเปลี่ยนค่านี้ได้
      const refAddr = SHOP_WALLET_ADDRESS; 
      
      // ✅ Use "NATIVE" logic instead of hardcoded ETH
      if (transferType === "NATIVE") {
        // Try simple transfer if contract fails or for multi-chain fallback
        try {
            const tx = await contract.transferETHWithReferral(recipient, refAddr, { value: ethersLib.utils.parseEther(amount) });
            await tx.wait();
        } catch (contractError) {
            console.warn("Contract transfer failed, falling back to simple transfer", contractError);
            const tx = await signer.sendTransaction({ to: recipient, value: ethersLib.utils.parseEther(amount) });
            await tx.wait();
        }
        recordTransaction("TRANSFER_NATIVE", amount, nativeTicker, recipient);
      } else {
        const tokenContract = new ethersLib.Contract(tokenAddress, erc20ABI, signer);
        const decimals = await tokenContract.decimals();
        const amountWei = ethersLib.utils.parseUnits(amount, decimals);
        const allowance = await tokenContract.allowance(account, contractAddress);
        if (allowance.lt(amountWei)) {
          const approveTx = await tokenContract.approve(contractAddress, ethersLib.constants.MaxUint256);
          await approveTx.wait();
        }
        const tx = await contract.transferTokenWithReferral(tokenAddress, recipient, amountWei, refAddr);
        await tx.wait();
        recordTransaction("TRANSFER_TOKEN", amount, "TOKEN", recipient);
      }
      showStatus("โอนสำเร็จ! ✅", "success");
      const newBal = await provider.getBalance(account);
      setBalance(parseFloat(ethersLib.utils.formatEther(newBal)).toFixed(4));
      setAmount("");
    } catch (err) { showStatus("เกิดข้อผิดพลาด: " + (err.reason || err.message), "error"); } finally { setIsLoading(false); }
  };

  // --- Shop Functions (FIXED) ---
  
  // ✅ 1. Logic สร้างหมวดหมู่แบบ Dynamic (ดึงจากสินค้าที่มีอยู่จริง)
  const existingCategories = ["All", ...new Set(products.map(p => p.category))];

  // ✅ New: Handle Save (Create/Update) News (Admin)
  const handleSaveNews = async () => {
      // 🔒 GUARD: Admin Only
      if (!isOwner) return showStatus("คุณไม่มีสิทธิ์ (Admin Only)", "error");

      const defaultProducts = [
        { name: "BoomTech Hoodie", price: 1290, category: "Merch", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=500&q=80" },
        { name: "Hardware Wallet X", price: 3500, category: "Gadget", image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=500&q=80" },
        { name: "VIP Signal (1 Month)", price: 1500, category: "Digital", image: "https://images.unsplash.com/photo-1611974765270-ca12586343bb?auto=format&fit=crop&w=500&q=80" },
        { name: "Mining Rig Frame", price: 4500, category: "Mining", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80" }
      ];

      setIsLoading(true);
      try {
          // ✅ FIX: Check Auth
          const isAuth = await ensureAuth();
          if(!isAuth) return showStatus("Auth Failed", "error");

          for (const p of defaultProducts) {
              await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shop_products'), { ...p, timestamp: Date.now() });
          }
          showStatus("✅ โหลดสินค้าตัวอย่างเสร็จสิ้น!", "success");
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  // ✅ 2. ฟังก์ชันบันทึกสินค้า (แก้ไขใหม่: รองรับการพิมพ์หมวดหมู่เอง + ตรวจสอบราคา)
  const handleSaveProduct = async () => {
      // 🔒 GUARD: Admin Only
      if (!isOwner) return showStatus("คุณไม่มีสิทธิ์แก้ไขสินค้า (Admin Only)", "error");

      if (!db) return showStatus("Database not initialized", "error");

      if (!newProduct.name || !newProduct.price || !newProduct.category) {
          return showStatus("กรุณากรอกชื่อ, ราคา และหมวดหมู่", "error");
      }
      const priceValue = parseFloat(newProduct.price);
      if (isNaN(priceValue) || priceValue < 0) {
          return showStatus("ราคาไม่ถูกต้อง (ต้องเป็นตัวเลข)", "error");
      }
      
      setIsLoading(true);
      try {
          // ✅ FIX: Check Auth before saving with Retry Logic
          let isAuth = await ensureAuth();
          if(!isAuth) {
              // Retry once
              console.log("Retrying auth...");
              await signInAnonymously(authInstance);
              isAuth = !!authInstance.currentUser;
          }
          
          if(!isAuth) {
             setIsLoading(false);
             return showStatus("ไม่สามารถยืนยันตัวตนได้ กรุณารีเฟรชหน้าเว็บ", "error");
          }

          const productData = {
              ...newProduct,
              price: priceValue,
              image: newProduct.image || "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=500&q=80",
              timestamp: Date.now()
          };

          if (editingProductId) {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shop_products', editingProductId), productData);
              showStatus("แก้ไขสินค้าเรียบร้อย ✅", "success");
              setEditingProductId(null);
          } else {
              await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shop_products'), productData);
              showStatus("เพิ่มสินค้าเรียบร้อย ✅", "success");
          }
          setNewProduct({ name: "", price: "", category: "Merch", image: "" });
      } catch (e) { 
          console.error(e); 
          if(e.code === 'permission-denied') {
             const uid = authInstance?.currentUser?.uid;
             showStatus(`Permission Denied! UID: ${uid} ไม่อยู่ใน Whitelist ของ Firestore Rules`, "error");
          } else {
              showStatus("บันทึกสินค้าล้มเหลว: " + e.message, "error"); 
          }
      } finally { 
          setIsLoading(false); 
      }
  };

  const startEditProduct = (product) => {
      setNewProduct({ ...product, price: product.price.toString() }); 
      setEditingProductId(product.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setNewProduct({ name: "", price: "", category: "Merch", image: "" });
      setEditingProductId(null);
  };

  const deleteProduct = async (id) => {
      // 🔒 GUARD: Admin Only
      if (!isOwner) return showStatus("คุณไม่มีสิทธิ์ลบสินค้า (Admin Only)", "error");

      if (!window.confirm("ยืนยันการลบสินค้านี้?")) return;
      if(editingProductId === id) cancelEdit();
      try {
          // ✅ FIX: Check Auth
          const isAuth = await ensureAuth();
          if(!isAuth) return showStatus("Auth Error", "error");
          
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shop_products', id));
          showStatus("ลบสินค้าแล้ว", "info");
      } catch (e) { 
          console.error("Delete Error", e);
          if(e.code === 'permission-denied') {
             const uid = authInstance?.currentUser?.uid;
             showStatus(`Permission Denied! UID: ${uid} ไม่อยู่ใน Whitelist ของ Firestore Rules`, "error");
          } else {
             showStatus("ลบสินค้าไม่สำเร็จ: " + e.message, "error"); 
          }
      }
  };

  // ✅ New: Admin Verification Logic
  const handleVerifyOrder = async (orderId, isApproved) => {
      if (!isOwner) return;
      try {
          // ✅ FIX: Check Auth
          const isAuth = await ensureAuth();
          if(!isAuth) return;

          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', orderId), {
              status: isApproved ? 'paid' : 'rejected'
          });
          showStatus(isApproved ? "อนุมัติออเดอร์แล้ว ✅" : "ปฏิเสธรายการแล้ว ❌", isApproved ? "success" : "error");
      } catch (e) {
          console.error(e);
          showStatus("เกิดข้อผิดพลาดในการอัปเดตสถานะ", "error");
      }
  };

  // ✅ New: Slip Upload Handler
  const uploadToStorage = async (file, path) => {
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSlipSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showStatus("ขนาดไฟล์เกิน 5MB", "error");
    setPaymentProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPaymentProof(reader.result);
    reader.readAsDataURL(file);
  };


  const addToCart = (product) => {
    setCart(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
        return [...prev, { ...product, qty: 1 }];
    });
    showStatus(`${product.name} เพิ่มลงตะกร้าแล้ว`, "success");
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  const updateQty = (id, delta) => setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));

  // ✅ Calculation Logic: Base is THB
  const cartTotalTHB = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const handleCheckout = async () => {
    if (!isLoggedIn() && paymentMethod !== 'PROMPTPAY') return showStatus("กรุณา Login หรือเชื่อมต่อ Wallet ก่อนชำระเงิน", "error");
    if (cart.length === 0) return;
    if (!shippingAddress.trim()) return showStatus("กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน", "error");

    setIsLoading(true);
    showStatus("กำลังดำเนินการชำระเงิน...", "info");

    const itemsSummary = cart.map(i => `${i.name} (x${i.qty})`).join(', ');
    const targetAddress = getRecipientAddress(); 

    try {
        if (paymentMethod === 'PROMPTPAY') {
            if (!paymentProof) throw new Error("กรุณาแนบรูปสลิปการโอนเงินเพื่อยืนยัน");

            let slipUrl = paymentProof;
            if (paymentProofFile && storage && firebaseUser) {
                slipUrl = await uploadToStorage(paymentProofFile, `payment_slips/${firebaseUser.uid}/${Date.now()}_${paymentProofFile.name}`);
            }

            await new Promise(r => setTimeout(r, 1000));
            recordTransaction("SHOP_BUY_QR", cartTotalTHB, "THB", "PromptPay", itemsSummary, shippingAddress, slipUrl);
        } else if (paymentMethod === 'USDT') {
            if (!usdtAddress) throw new Error("กรุณาระบุที่อยู่สัญญา USDT (Contract Address)");
            if (!ethersLib.utils.isAddress(usdtAddress)) throw new Error("ที่อยู่สัญญาไม่ถูกต้อง");

            const tokenContract = new ethersLib.Contract(usdtAddress, erc20ABI, signer);
            const decimals = await tokenContract.decimals();
            
            // Calculate USDT
            const usdtValue = cartTotalTHB / usdtThbRate;
            // Use 6 decimals for USDT typically, but rely on contract decimals
            const amountWei = ethersLib.utils.parseUnits(usdtValue.toFixed(6).toString(), decimals);

            const userTokenBalance = await tokenContract.balanceOf(account);
            if (userTokenBalance.lt(amountWei)) throw new Error(`ยอดเงิน USDT ไม่เพียงพอ (${usdtValue.toFixed(2)} USDT)`);

            const tx = await tokenContract.transfer(targetAddress, amountWei); 
            showStatus("รอการยืนยันธุรกรรม USDT...", "info");
            await tx.wait();
            
            recordTransaction("SHOP_BUY_USDT", usdtValue.toFixed(2), "USDT", targetAddress, itemsSummary, shippingAddress);
        }

        // ✅ AUTO-POST TO CHAT
        const buyerName = getUserDisplayName();
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'community_chat'), {
            text: `🛍️ **NEW ORDER RECEIVED!**\n\n👤 Buyer: ${buyerName}\n📦 Items:\n${itemsSummary.replace(/, /g, '\n')}\n💰 Total: ${cartTotalTHB.toLocaleString()} THB\n💳 via ${paymentMethod}`,
            sender: "BoomShop Bot 🤖",
            isWallet: false,
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=BoomShop",
            timestamp: Date.now()
        });

        showStatus("คำสั่งซื้อสำเร็จ! รอการตรวจสอบ...", "success");
        setCart([]);
        setShippingAddress("");
        setPaymentProof(null);
        setPaymentProofFile(null);
        setIsCartOpen(false);
        
    } catch (err) {
        console.error("Checkout error:", err);
        showStatus("การชำระเงินล้มเหลว: " + (err.reason || err.message), "error");
    } finally {
        setIsLoading(false);
    }
  };

  // --- Other Functions ---
  const handleDonate = async () => {
    // 🔒 SECURITY: Use hardcoded admin address
    const targetAddress = getRecipientAddress(); 
    
    if (!amount || parseFloat(amount) <= 0) return showStatus("กรุณาระบุจำนวนเงินให้ถูกต้อง", "error");

    if (donateType === "PROMPTPAY") {
        setIsLoading(true);
        // Simulate API call / User scanning time
        await new Promise(r => setTimeout(r, 2000));
        recordTransaction("DONATE_QR", amount, "THB", "Treasury");
        showStatus("ขอบคุณสำหรับการบริจาคผ่าน PromptPay! 🙏", "success");
        setAmount("");
        setIsLoading(false);
        return;
    }

    if (!ethersLib) return showStatus("กรุณาเชื่อมต่อกระเป๋าเงิน", "error");
    if (!account) return showStatus("กรุณาเชื่อมต่อกระเป๋าเงิน", "error");

    setIsLoading(true);
    showStatus("กำลังดำเนินการบริจาค...", "info");

    try {
      // ✅ Use NATIVE donate type (ETH, BNB, MATIC, KUB based on current network)
      if (donateType === "NATIVE") {
        const tx = await signer.sendTransaction({ 
            to: targetAddress, 
            value: ethersLib.utils.parseEther(amount) 
        });
        await tx.wait();
        recordTransaction("DONATE_NATIVE", amount, nativeTicker, "Treasury");
      } else if (donateType === "ERC20") {
        if (!ethersLib.utils.isAddress(donateTokenAddress)) throw new Error("ที่อยู่ Token ไม่ถูกต้อง");

        const tokenContract = new ethersLib.Contract(donateTokenAddress, erc20ABI, signer);
        const decimals = await tokenContract.decimals();
        const amountWei = ethersLib.utils.parseUnits(amount, decimals);
        
        const bal = await tokenContract.balanceOf(account);
        if (bal.lt(amountWei)) throw new Error(`ยอดเงิน Token ไม่เพียงพอ`);
        
        const tx = await tokenContract.transfer(targetAddress, amountWei);
        await tx.wait();
        recordTransaction("DONATE_TOKEN", amount, "TOKEN", "Treasury");
      }
      showStatus("ขอบคุณสำหรับการบริจาค! 🙏 เงินเข้ากระเป๋า Admin แล้ว", "success");
      setAmount("");
    } catch (err) { 
        console.error("Donate Error:", err);
        showStatus("บริจาคไม่สำเร็จ: " + (err.reason || err.message), "error"); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleUpdateFee = async () => {
    if (!ethersLib) return; setIsLoading(true);
    try { const contract = new ethersLib.Contract(contractAddress, contractABI, signer); await (await contract.setFeeBps(newFee)).wait(); showStatus("อัปเดตค่าธรรมเนียมเรียบร้อย", "success"); } catch (err) { showStatus("Error: " + err.message, "error"); } finally { setIsLoading(false); }
  };

  const handleUpdateTreasury = async () => {
    if (!ethersLib) return; setIsLoading(true);
    try { const contract = new ethersLib.Contract(contractAddress, contractABI, signer); await (await contract.setTreasury(newTreasury)).wait(); showStatus("อัปเดต Treasury Wallet เรียบร้อย", "success"); setNewTreasury(""); } catch (err) { showStatus("Error: " + err.message, "error"); } finally { setIsLoading(false); }
  };

  const fetchPriceData = async () => {
    if (isCustomSymbol) return;
    setIsMarketLoading(true); 
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${selectedCoin}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`);
      const data = await res.json();
      if (data[selectedCoin]) {
        setCurrentPrice(data[selectedCoin].usd);
        setPriceChange(data[selectedCoin].usd_24h_change);
      }
      const detailRes = await fetch(`https://api.coingecko.com/api/v3/coins/${selectedCoin}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
      const detailData = await detailRes.json();
      if (detailData.symbol) {
          setCoinSymbol(detailData.symbol.toUpperCase());
          if (detailData.image?.large) setCoinImage(detailData.image.large);
          // ✅ Update full detailed stats
          if (detailData.market_data) {
              setMarketStats({
                  marketCap: detailData.market_data.market_cap.usd,
                  totalVolume: detailData.market_data.total_volume.usd,
                  high24h: detailData.market_data.high_24h.usd,
                  low24h: detailData.market_data.low_24h.usd,
                  ath: detailData.market_data.ath.usd,
                  athChange: detailData.market_data.ath_change_percentage.usd,
                  atl: detailData.market_data.atl.usd,
                  atlChange: detailData.market_data.atl_change_percentage.usd,
                  circulatingSupply: detailData.market_data.circulating_supply,
                  totalSupply: detailData.market_data.total_supply,
                  maxSupply: detailData.market_data.max_supply,
                  fdv: detailData.market_data.fully_diluted_valuation.usd
              });
          }
      }
    } catch (e) { console.error("Price data error", e); }
    finally { setTimeout(() => setIsMarketLoading(false), 500); } 
  };

  const fetchGlobalData = async () => {
      try { const fgRes = await fetch("https://api.alternative.me/fng/?limit=1"); const fgData = await fgRes.json(); if (fgData.data && fgData.data.length > 0) setFearGreed({ value: parseInt(fgData.data[0].value), status: fgData.data[0].value_classification }); } catch (e) {}
  };

  // ✅ Auto Fetch Updates
  useEffect(() => {
    let interval;

    if (activeTab === 'market') {
        const loadMarket = () => {
            fetchGlobalData();
            if (!isCustomSymbol) fetchPriceData();
        };
        loadMarket(); // Initial load
        interval = setInterval(loadMarket, 30000); // Refresh every 30s
    }

    return () => {
        if (interval) clearInterval(interval);
    };
  }, [activeTab, selectedCoin, isCustomSymbol]); 

  // ✅ New: Handle Post News (Admin)
  const handlePostNews = async () => {
      // 🔒 GUARD: Admin Only
      if (!isOwner) return showStatus("คุณไม่มีสิทธิ์โพสต์ข่าว", "error");
      
      if (!newNews.title || !newNews.url) return showStatus("กรุณาระบุหัวข้อและลิงก์", "error");

      try {
          const isAuth = await ensureAuth();
          if(!isAuth) return showStatus("Auth Failed", "error");

          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'news_posts'), {
              ...newNews,
              published_on: Date.now() / 1000,
              source_info: { 
                  name: newNews.source || "Admin", 
                  img: "https://api.dicebear.com/7.x/initials/svg?seed=Admin" 
              }
          });
          
          setShowNewsForm(false);
          setNewNews({ title: "", body: "", imageurl: "", url: "", source: "Admin" });
          showStatus("โพสต์ข่าวเรียบร้อย ✅", "success");
      } catch (e) {
          console.error(e);
          showStatus("โพสต์ข่าวล้มเหลว", "error");
      }
  };
  
  const handleDeleteNews = async (id) => {
      if(!isOwner) return;
      if(!confirm("ลบข่าวนี้?")) return;
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'news_posts', id));
          showStatus("ลบข่าวแล้ว", "info");
      } catch(e) {
          showStatus("ลบไม่สำเร็จ", "error");
      }
  };

  // ✅ New: Admin Community Tools
  const refreshChat = () => {
    showStatus("รีเฟรชกระดานสนทนาเรียบร้อย ✅", "success");
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchCoin = async (e) => {
    e.preventDefault();
    if (!coinInput.trim()) return;
    
    // ✅ FIX: Allow spaces for CoinGecko search, only force custom if it contains ':'
    if (coinInput.includes(':')) { 
        setCoinSymbol(coinInput.toUpperCase()); 
        setIsCustomSymbol(true); 
        setCoinInput(""); 
        return; 
    }

    setIsMarketLoading(true);
    try {
        const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${coinInput}`);
        const searchData = await searchRes.json();
        
        if (searchData.coins && searchData.coins.length > 0) { 
            // Found: Set CoinGecko ID & Symbol
            const coin = searchData.coins[0];
            setSelectedCoin(coin.id); 
            setCoinSymbol(coin.symbol.toUpperCase());
            setIsCustomSymbol(false); 
            setCoinInput(""); 
        } else { 
            // Not Found: Fallback to TradingView
            setCoinSymbol(coinInput.toUpperCase()); 
            setIsCustomSymbol(true); 
            setCoinInput(""); 
            showStatus(`ไม่พบใน CoinGecko - ค้นหาบน TradingView แทน`, "info"); 
        }
    } catch (err) { 
        console.error("Search error", err);
        setCoinSymbol(coinInput.toUpperCase()); 
        setIsCustomSymbol(true); 
        setCoinInput(""); 
    } finally {
         // Note: Loading state is managed by fetchPriceData when dependencies change
         // But if custom symbol, we stop loading here manually
         if (coinInput.includes(':') || (isCustomSymbol)) setIsMarketLoading(false);
    }
  };

  const TradingViewWidget = ({ symbol, isCustom }) => {
    const containerRef = useRef(null);
    const containerId = `tv-widget-${Math.random().toString(36).substr(2, 9)}`;
    useEffect(() => {
        let tvInterval;
        const loadWidget = () => {
            if (window.TradingView && containerRef.current) {
                containerRef.current.innerHTML = "";
                let finalSymbol = symbol;
                if (!isCustom && !symbol.includes(':')) finalSymbol = `BINANCE:${symbol}USDT`;
                new window.TradingView.widget({ "autosize": true, "symbol": finalSymbol, "interval": "D", "timezone": "Asia/Bangkok", "theme": "dark", "style": "1", "locale": "th_TH", "toolbar_bg": "#f1f3f6", "enable_publishing": false, "allow_symbol_change": true, "container_id": containerId });
            }
        };
        if (!document.getElementById('tv-widget-script')) { const script = document.createElement("script"); script.id = 'tv-widget-script'; script.src = "https://s3.tradingview.com/tv.js"; script.async = true; script.onload = loadWidget; document.head.appendChild(script); } else { if (window.TradingView) { loadWidget(); } else { tvInterval = setInterval(() => { if (window.TradingView) { clearInterval(tvInterval); loadWidget(); } }, 200); } }
        return () => { if (tvInterval) clearInterval(tvInterval); };
    }, [symbol, isCustom]);
    return <div id={containerId} ref={containerRef} className="w-full h-[600px] rounded-xl overflow-hidden border border-white/10 relative shadow-2xl" />;
  };

  const handleAiSendMessage = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const userMsg = { id: Date.now(), sender: 'user', text: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    const currentQuery = aiInput;
    setAiInput("");
    setIsAiTyping(true);
    try {
        const apiKey = ""; 
        const systemPrompt = `You are BoomBot AI, an intelligent crypto assistant. Current Market Context: Active Coin: ${coinSymbol}, Price: $${currentPrice.toLocaleString()}, 24h Change: ${priceChange.toFixed(2)}%, Market Cap: $${marketStats.marketCap.toLocaleString()}, Fear & Greed: ${fearGreed.value} (${fearGreed.status}). Role: Crypto assistant. Tone: Friendly, professional. Language: Thai.`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: currentQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] } }) });
        const data = await response.json();
        const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "ขออภัย ผมไม่สามารถประมวลผลคำตอบได้";
        setAiMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponse }]);
    } catch (error) { setAiMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: `เกิดข้อผิดพลาด: ${error.message}` }]); } finally { setIsAiTyping(false); }
  };
  
  useEffect(() => { if (isAiChatOpen) aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages, isAiTyping, isAiChatOpen]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showStatus("รูปภาพต้องมีขนาดไม่เกิน 5MB", "error");
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!chatInput.trim() && !selectedImage) || !db) return;
    const senderName = getUserDisplayName();
    const avatar = account ? `https://api.dicebear.com/7.x/identicon/svg?seed=${account}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`;
    try {
        let imageUrl = null;
        if (selectedImageFile && storage && firebaseUser) {
            imageUrl = await uploadToStorage(selectedImageFile, `chat_images/${firebaseUser.uid}/${Date.now()}_${selectedImageFile.name}`);
        }
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'community_chat'), { text: chatInput, image: imageUrl, sender: senderName, isWallet: !!account, avatar: avatar, timestamp: Date.now() });
        setChatInput(""); setSelectedImage(null); setSelectedImageFile(null);
    } catch (error) { showStatus("ส่งข้อความไม่สำเร็จ", "error"); }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); showStatus("คัดลอกแล้ว", "success"); };
  const formatNumber = (num) => { if (!num) return "-"; if (num >= 1e9) return (num / 1e9).toFixed(2) + "B"; if (num >= 1e6) return (num / 1e6).toFixed(2) + "M"; return num.toLocaleString(); };

  // ✅ NEW: Game Logic Implementation
  const handleGameAction = (action) => {
        if (!isLoggedIn()) return showStatus("กรุณา Login เพื่อเล่นเกม", "error");
        
        setPet(prev => {
            let next = { ...prev };
            let msg = "";
            let type = "info";

            switch (action) {
                case 'feed':
                    if (prev.hunger >= 100) { msg = "อิ่มแล้ว!"; type = "error"; }
                    else {
                        next.hunger = Math.min(100, prev.hunger + 20);
                        next.exp += 5;
                        msg = "Yummy! (+Hunger, +EXP)";
                        type = "success";
                    }
                    break;
                case 'train':
                    if (prev.energy < 20) { msg = "เหนื่อยเกินไป! ต้องนอนพัก"; type = "error"; }
                    else {
                        next.energy -= 20;
                        next.happiness = Math.min(100, prev.happiness + 15);
                        next.exp += 15;
                        msg = "Training complete! (-Energy, +Happy, +EXP)";
                        type = "success";
                    }
                    break;
                case 'sleep':
                    next.isSleeping = !prev.isSleeping;
                    msg = next.isSleeping ? "Zzz..." : "ตื่นแล้ว!";
                    break;
                case 'hatch': // Handle hatch (used by icon click)
                     if (prev.stage === 'egg') {
                         next.stage = 'baby';
                         next.exp = 0;
                         msg = "ฟักไข่สำเร็จ! ยินดีต้อนรับ";
                         type = "success";
                     }
                     break;
            }
            
            // Check Evolution
            const currentStageConfig = PET_STAGES[next.stage];
            if (currentStageConfig.next && next.exp >= currentStageConfig.reqExp) {
                next.stage = currentStageConfig.next;
                next.exp = 0;
                msg = `Evolved to ${PET_STAGES[next.stage].name}!`;
                type = "success";
                setGameScore(s => s + 500); // Bonus score
            }

            if(msg) showStatus(msg, type);
            
            // Auto Save triggered by effect, but can force here too if needed
            // saveGameData(next, gameScore);

            return next;
        });
    };

  return (
    <div className={`min-h-screen ${bodyFont} bg-[#050505] text-slate-200 p-4 md:p-6 relative overflow-hidden`}>
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/40 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/40 rounded-full blur-[120px] animate-pulse delay-1000"></div>
          <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-cyan-900/20 rounded-full blur-[80px]"></div>
      </div>
      
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Slip Preview Modal (Admin) */}
      {slipPreviewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className="relative max-w-lg w-full p-4">
                  <button onClick={() => setSlipPreviewUrl(null)} className="absolute -top-10 right-0 text-white hover:text-red-400"><XCircle className="w-8 h-8"/></button>
                  <img src={slipPreviewUrl} alt="Slip" className="w-full rounded-2xl shadow-2xl" />
              </div>
          </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`w-full max-w-md ${glassPanel} p-8 rounded-3xl relative border-t border-white/20`}>
                <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-transform hover:rotate-90"><XCircle className="w-6 h-6"/></button>
                <div className="text-center mb-8">
                    <div className="inline-block p-3 rounded-2xl bg-indigo-500/20 mb-4"><LogIn className="w-8 h-8 text-indigo-400"/></div>
                    <h3 className={`text-3xl font-bold text-white ${headingFont}`}>{t.auth.signIn}</h3>
                    <p className="text-slate-400 text-sm mt-2">{t.auth.newHere}</p>
                </div>
                
                <form onSubmit={handleEmailAuth} className="space-y-4">
                    {authMode === 'signup' && (
                        <div className="group">
                            <label className="block text-xs text-slate-400 mb-1 ml-1 group-focus-within:text-indigo-400 transition-colors">{t.auth.displayName}</label>
                            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={`w-full px-4 py-3 rounded-xl text-sm ${glassInput}`} required placeholder="John Doe" />
                        </div>
                    )}
                    <div className="group">
                        <label className="block text-xs text-slate-400 mb-1 ml-1 group-focus-within:text-indigo-400 transition-colors">{t.auth.email}</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full px-4 py-3 rounded-xl text-sm ${glassInput}`} required placeholder="name@example.com" />
                    </div>
                    <div className="group">
                        <label className="block text-xs text-slate-400 mb-1 ml-1 group-focus-within:text-indigo-400 transition-colors">{t.auth.password}</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full px-4 py-3 rounded-xl text-sm ${glassInput}`} required placeholder="••••••••" />
                    </div>
                    {authError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center flex items-center justify-center gap-2"><AlertTriangle className="w-3 h-3"/>{authError}</div>}
                    <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center gap-2 mt-2">
                        {authLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : (authMode === 'login' ? t.auth.signIn : t.auth.signUp)}
                    </button>
                </form>
                <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-6">
                    <span>{authMode === 'login' ? t.auth.newHere : t.auth.haveAcc}</span>
                    <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-all">
                        {authMode === 'login' ? t.auth.signUp : t.auth.signIn}
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Modern Header */}
        <div className={`flex flex-col md:flex-row justify-between items-center p-4 md:p-6 rounded-3xl ${glassPanel} sticky top-0 z-40`}>
          <div className="flex items-center gap-5 mb-4 md:mb-0 w-full md:w-auto">
            <div className="relative group cursor-pointer">
                 <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
                 <div className="relative w-14 h-14 bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
                     <svg viewBox="0 0 64 64" className="w-8 h-8" fill="none"><path d="M32 4 L60 20 L60 44 L32 60 L4 44 L4 20 Z" stroke="url(#logo-grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><path d="M32 32 L60 20 M32 32 L4 20 M32 32 L32 60" stroke="url(#logo-grad)" strokeWidth="4" strokeLinecap="round" opacity="0.5"/><defs><linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#d946ef" /></linearGradient></defs></svg>
                 </div>
            </div>
            <div>
                <h1 className={`text-2xl md:text-3xl font-extrabold ${textGradient} ${headingFont}`}>BoomTech</h1>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Web3 Gateway</span>
                    {/* ✅ Network Status Indicator */}
                    {chainId && NETWORKS[chainId] ? (
                        <div className={`px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold flex items-center gap-1 ${NETWORKS[chainId].color}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                            {NETWORKS[chainId].name}
                        </div>
                    ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    )}
                </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
             {/* ✅ Language Switcher */}
             <button onClick={() => setLang(l => l === 'EN' ? 'TH' : 'EN')} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-colors flex items-center gap-2">
                <Languages className="w-4 h-4" /> {lang === 'EN' ? 'EN' : 'TH'}
            </button>

            {isLoggedIn() ? (
                <div className={`flex items-center gap-3 pl-4 pr-2 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md`}>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-white leading-tight">{getUserDisplayName()}</span>
                        <span className="text-[10px] text-emerald-400 font-medium">{t.header.online}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 p-0.5">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${getUserDisplayName()}`} className="w-full h-full rounded-full bg-slate-900" alt="avatar"/>
                    </div>
                    <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors ml-1"><LogOut className="w-4 h-4"/></button>
                </div>
            ) : (
                <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 ${glassButton}`}><LogIn className="w-4 h-4" /> {t.header.login}</button>
            )}
            
            <div className="h-8 w-[1px] bg-white/10 mx-1 hidden md:block"></div>

            <button onClick={connectWallet} className={`group px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-lg ${account ? "bg-slate-800/80 border border-emerald-500/30 text-emerald-400" : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20"}`}>
                {account ? <><div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>{account.slice(0,6)}...{account.slice(-4)}</> : <><Wallet className="w-4 h-4 group-hover:-rotate-12 transition-transform" /> {t.header.connect}</>}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
            
            {/* Navigation Sidebar / Bottom Bar */}
            <div className="md:col-span-12 sticky top-[100px] z-30">
                 <div className={`flex md:justify-center overflow-x-auto pb-1 md:pb-0 scrollbar-hide`}>
                    <div className={`flex p-1.5 rounded-2xl md:rounded-full bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl gap-1`}>
                        {[
                            { id: 'wallet', icon: Wallet, label: t.tabs.wallet }, 
                            { id: 'market', icon: BarChart2, label: t.tabs.market }, 
                            { id: 'game', icon: Gamepad2, label: t.tabs.game }, 
                            { id: 'shop', icon: ShoppingBag, label: t.tabs.shop }, 
                            { id: 'news', icon: Newspaper, label: t.tabs.news }, 
                            { id: 'community', icon: MessageSquare, label: t.tabs.community }, 
                            { id: 'donate', icon: Heart, label: t.tabs.donate }, 
                            { id: 'admin', icon: Settings, label: t.tabs.admin }
                        ].map(tab => {
                        if (tab.id === 'admin' && !isOwner) return null;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                                className={`relative px-5 py-2.5 rounded-xl md:rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-300 whitespace-nowrap group ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                                {isActive && <div className="absolute inset-0 bg-white/10 rounded-xl md:rounded-full shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] border border-white/5"></div>}
                                <tab.icon className={`w-4 h-4 relative z-10 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}`} /> 
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                        })}
                    </div>
                 </div>
            </div>

            {/* Dynamic Content */}
            <div className="md:col-span-12 min-h-[600px]">
                {activeTab === 'shop' && cart.length > 0 && (
                    <button onClick={() => setIsCartOpen(!isCartOpen)} className="fixed bottom-8 right-8 z-50 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all hover:scale-110 active:scale-95 group">
                        <div className="relative"><ShoppingCart className="w-6 h-6" /><span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 font-bold">{cart.reduce((a,b) => a+b.qty, 0)}</span></div>
                    </button>
                )}

                <div className={`p-6 md:p-8 rounded-3xl ${glassPanel} animate-in fade-in slide-in-from-bottom-8 duration-500 relative overflow-hidden`}>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-white/5 to-transparent rounded-bl-full pointer-events-none"></div>

                    {/* Wallet Tab */}
                    {activeTab === 'wallet' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-center mb-8">
                                <div className="inline-flex p-1 bg-slate-950/50 rounded-full border border-white/10">
                                    <button onClick={() => setWalletMode('transfer')} className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${walletMode === 'transfer' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Send className="w-4 h-4" /> {t.wallet.send}</button>
                                    <button onClick={() => setWalletMode('deposit')} className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${walletMode === 'deposit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><QrCode className="w-4 h-4" /> {t.wallet.receive}</button>
                                </div>
                            </div>
                            
                            {walletMode === 'transfer' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="bg-slate-950/30 p-6 rounded-2xl border border-white/5 space-y-4">
                                            
                                            {/* ✅ 1. Chain Selection Menu */}
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">{t.wallet.selectChain}</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Object.entries(NETWORKS).map(([id, net]) => (
                                                        <button 
                                                            key={id} 
                                                            onClick={() => handleSwitchNetwork(id)}
                                                            className={`px-3 py-2.5 rounded-xl border flex items-center justify-between transition-all ${chainId === id ? `${net.bg} ${net.border} text-white` : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:bg-slate-900'}`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Network className={`w-4 h-4 ${net.color}`} />
                                                                <span className="text-xs font-bold">{net.name}</span>
                                                            </div>
                                                            {chainId === id && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Token Type Toggle */}
                                            <div className="flex gap-2 p-1 bg-slate-900 rounded-xl">
                                                <button onClick={() => setTransferType('NATIVE')} className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${transferType === 'NATIVE' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                                                    <Coins className="w-3 h-3"/> {t.wallet.native} ({nativeTicker})
                                                </button>
                                                <button onClick={() => setTransferType('ERC20')} className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${transferType === 'ERC20' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                                                    <CreditCard className="w-3 h-3"/> {t.wallet.token} (ERC-20)
                                                </button>
                                            </div>

                                            {transferType === 'ERC20' && (<div><label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">{t.wallet.tokenAddr}</label><input type="text" placeholder="0x..." value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} className={`w-full px-4 py-3 rounded-xl ${glassInput}`} /></div>)}
                                            <div><label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">{t.wallet.recipient}</label><input type="text" placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} className={`w-full px-4 py-3 rounded-xl ${glassInput}`} /></div>
                                            <div><label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">{t.wallet.amount}</label><div className="relative"><input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full pl-4 pr-16 py-3 rounded-xl ${glassInput} font-mono text-lg`} /><span className="absolute right-4 top-4 text-xs font-bold text-slate-400">{transferType === 'NATIVE' ? nativeTicker : 'TOKENS'}</span></div></div>
                                            
                                            <button onClick={handleTransfer} disabled={isLoading || !recipient || !amount} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isLoading ? 'bg-slate-700' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-900/30'}`}>{isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><ArrowRightLeft className="w-5 h-5" /> {t.wallet.confirm}</>}</button>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/30 p-6 rounded-2xl border border-white/5 flex flex-col h-full">
                                        <h3 className={`text-lg font-bold text-white mb-4 flex items-center gap-2 ${headingFont}`}><History className="w-5 h-5 text-indigo-400"/> {t.wallet.recent}</h3>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                            {transactions.length === 0 ? <div className="h-full flex items-center justify-center text-slate-600 text-sm">{t.wallet.noTx}</div> : transactions.map(tx => (
                                                <div key={tx.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`font-bold text-xs px-2 py-0.5 rounded ${tx.type.includes('BUY') ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{tx.type}</span>
                                                        <span className="text-slate-500 text-[10px]">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div><div className="text-xs text-slate-500">To</div><div className="text-xs text-slate-300 font-mono">{tx.to.slice(0,6)}...{tx.to.slice(-4)}</div></div>
                                                        <div className="text-white font-mono font-bold">{tx.amount} <span className="text-xs text-slate-500">{tx.token}</span></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {walletMode === 'deposit' && (
                                <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in zoom-in duration-300">
                                    {account ? (
                                        <div className="p-4 bg-white rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${account}`} alt="Wallet QR" className="w-64 h-64 rounded-xl mix-blend-multiply" />
                                        </div>
                                    ) : (
                                        <div className="w-64 h-64 rounded-3xl flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 bg-slate-900/50"><p>{t.header.connect}</p></div>
                                    )}
                                    <div className="w-full max-w-md">
                                        <label className="text-center block text-slate-400 text-xs mb-2 uppercase tracking-widest">{t.wallet.yourAddr}</label>
                                        <div className="flex items-center gap-3 bg-slate-950 p-2 pl-4 rounded-xl border border-white/10 group hover:border-indigo-500/50 transition-colors">
                                            <code className="flex-1 font-mono text-emerald-400 text-sm truncate">{account || "Not Connected"}</code>
                                            <button onClick={() => account && copyToClipboard(account)} className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"><Copy className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Market Tab */}
                    {activeTab === 'market' && (
                        <div className="space-y-6">
                            {/* ✅ Binance Banner */}
                            <div className="p-1 rounded-2xl bg-gradient-to-r from-[#F0B90B] to-[#F8D33A] shadow-lg shadow-yellow-500/20">
                                <div className="bg-slate-950/90 backdrop-blur-md rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-[#F0B90B] p-3 rounded-lg text-black">
                                            <svg viewBox="0 0 32 32" className="w-6 h-6 fill-current"><path d="M16 0l6 6-6 6-6-6 6-6zM6 6l6 6-6 6-6-6 6-6zM26 6l6 6-6 6-6-6 6-6zM16 12l6 6-6 6-6-6 6-6zM6 18l6 6-6 6-6-6 6-6zM26 18l6 6-6 6-6-6 6-6zM16 24l6 6-6 6-6-6 6-6z"/></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg">{t.market.binanceTitle}</h3>
                                            <p className="text-slate-400 text-xs">{t.market.binanceDesc} <span className="text-[#F0B90B] font-mono">GRO_28502_6PQ0U</span></p>
                                        </div>
                                    </div>
                                    <a href="https://www.binance.com/en/register?ref=GRO_28502_6PQ0U" target="_blank" rel="noreferrer" className="px-6 py-2 bg-[#F0B90B] hover:bg-[#ffe255] text-black font-bold rounded-lg transition-colors text-sm whitespace-nowrap">
                                        Register Now
                                    </a>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-3 relative">
                                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                                    <input type="text" value={coinInput} onChange={(e) => setCoinInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchCoin(e)} placeholder={t.market.search} className={`w-full pl-12 pr-4 py-3 rounded-2xl ${glassInput}`} />
                                    <button onClick={handleSearchCoin} className="absolute right-2 top-2 bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors">Search</button>
                                </div>
                                <button onClick={fetchPriceData} className={`rounded-2xl font-bold text-sm flex items-center justify-center gap-2 ${glassButton} md:col-span-1`}><RefreshCw className={`w-4 h-4 ${isMarketLoading ? 'animate-spin' : ''}`} /> {t.market.refresh}</button>
                            </div>
                            
                            {!isCustomSymbol && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-slate-400 text-[10px] uppercase mb-1">{t.market.price}</div>
                                        <div className="text-xl font-bold text-white font-mono">${currentPrice.toLocaleString()}</div>
                                        <div className={`text-xs font-bold mt-1 ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-slate-400 text-[10px] uppercase mb-1">{t.market.mcap}</div>
                                        <div className="text-sm font-bold text-white">${formatNumber(marketStats.marketCap)}</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-slate-400 text-[10px] uppercase mb-1">{t.market.vol}</div>
                                        <div className="text-sm font-bold text-white">${formatNumber(marketStats.totalVolume)}</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-slate-400 text-[10px] uppercase mb-1">{t.market.fear}</div>
                                        <div className="text-sm font-bold text-white flex items-center gap-2">{fearGreed.value} <span className={`text-[10px] px-2 py-0.5 rounded-full ${fearGreed.value > 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{fearGreed.status}</span></div>
                                    </div>
                                    
                                    {/* ✅ Detailed Row 2 - ATH/ATL */}
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-slate-400 text-[10px] uppercase mb-1">{t.market.ath}</div>
                                        <div className="text-sm font-bold text-white font-mono">${marketStats.ath.toLocaleString()}</div>
                                        <div className="text-[10px] text-red-400 mt-0.5">{marketStats.athChange?.toFixed(1)}%</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-slate-400 text-[10px] uppercase mb-1">{t.market.atl}</div>
                                        <div className="text-sm font-bold text-white font-mono">${marketStats.atl.toLocaleString()}</div>
                                        <div className="text-[10px] text-emerald-400 mt-0.5">+{marketStats.atlChange?.toFixed(1)}%</div>
                                    </div>
                                    
                                    {/* ✅ Detailed Row 3 - Supply */}
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-slate-400 text-[10px] uppercase mb-1">{t.market.supply}</div>
                                        <div className="text-sm font-bold text-white">{formatNumber(marketStats.circulatingSupply)}</div>
                                        {marketStats.maxSupply && (
                                            <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                                                <div className="bg-indigo-500 h-full" style={{ width: `${(marketStats.circulatingSupply / marketStats.maxSupply) * 100}%` }}></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="text-slate-400 text-[10px] uppercase mb-1">{t.market.fdv}</div>
                                        <div className="text-sm font-bold text-white">${formatNumber(marketStats.fdv || marketStats.marketCap)}</div>
                                    </div>
                                </div>
                            )}

                            <div className="w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                                <TradingViewWidget symbol={coinSymbol} isCustom={isCustomSymbol} />
                            </div>
                        </div>
                    )}

                    {/* Game Tab */}
                    {activeTab === 'game' && (
                        <div className="min-h-[600px] flex flex-col items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent pointer-events-none rounded-3xl"></div>
                            <div className="w-full max-w-lg z-10">
                                <div className="text-center mb-8">
                                    <h2 className={`text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-400 to-indigo-400 ${headingFont}`}>{t.game.title}</h2>
                                    <p className="text-slate-400 mt-2 font-light tracking-wide">{t.game.subtitle}</p>
                                </div>

                                <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                                    {/* Stats overlay */}
                                    <div className="absolute top-6 left-6 right-6 flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest z-20">
                                        <span>LVL {Math.floor(pet.exp/100) + 1}</span>
                                        <span>BP: {gameScore.toLocaleString()}</span>
                                    </div>

                                    {/* Pet Display */}
                                    <div className="h-64 flex items-center justify-center relative my-4 group">
                                        <div className={`absolute inset-0 bg-gradient-to-t from-${PET_STAGES[pet.stage].color.split('-')[1]}-500/20 to-transparent opacity-50 blur-3xl rounded-full group-hover:opacity-80 transition-opacity duration-700`}></div>
                                        {pet.isSleeping && <div className="absolute top-10 right-20 text-4xl animate-bounce">💤</div>}
                                        {(() => {
                                            const Icon = PET_STAGES[pet.stage].icon;
                                            return <Icon className={`w-40 h-40 ${PET_STAGES[pet.stage].color} drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] transform transition-transform duration-500 ${pet.stage === 'egg' ? 'animate-bounce cursor-pointer' : 'animate-pulse'}`} onClick={() => handleGameAction('hatch')} />
                                        })()}
                                    </div>

                                    {/* Circular Action Menu */}
                                    <div className="grid grid-cols-3 gap-4 relative z-20">
                                        <button onClick={() => handleGameAction('feed')} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-orange-500/20 hover:border-orange-500/50 border border-white/5 transition-all group">
                                            <Utensils className="w-6 h-6 text-orange-400 group-hover:scale-125 transition-transform" />
                                            <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-white">{t.game.feed}</span>
                                        </button>
                                        <button onClick={() => handleGameAction('train')} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-blue-500/20 hover:border-blue-500/50 border border-white/5 transition-all group">
                                            <Zap className="w-6 h-6 text-blue-400 group-hover:scale-125 transition-transform" />
                                            <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-white">{t.game.train}</span>
                                        </button>
                                        <button onClick={() => handleGameAction('sleep')} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-purple-500/20 hover:border-purple-500/50 border border-white/5 transition-all group">
                                            {pet.isSleeping ? <Sun className="w-6 h-6 text-yellow-400 group-hover:scale-125 transition-transform" /> : <Moon className="w-6 h-6 text-purple-400 group-hover:scale-125 transition-transform" />}
                                            <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-white">{pet.isSleeping ? t.game.wake : t.game.sleep}</span>
                                        </button>
                                    </div>

                                    {/* Status Bars */}
                                    <div className="mt-6 space-y-2">
                                        {['hunger', 'energy', 'happiness'].map(stat => (
                                            <div key={stat} className="flex items-center gap-3">
                                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${stat === 'hunger' ? 'bg-orange-500' : stat === 'energy' ? 'bg-blue-500' : 'bg-pink-500'} transition-all duration-1000`} style={{width: `${pet[stat]}%`}}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shop Tab (MODERNIZED & RESTORED FULL OPTION) */}
                    {activeTab === 'shop' && (
                        <div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                                <div>
                                    <h2 className={`text-3xl font-bold text-white mb-2 ${headingFont}`}>{t.shop.title}</h2>
                                    <p className="text-slate-400 text-sm">{t.shop.subtitle}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {existingCategories.map(cat => (
                                        <button key={cat} onClick={() => setShopCategory(cat)} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${shopCategory === cat ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}>{cat}</button>
                                    ))}
                                </div>
                            </div>

                            {/* 🔓 DEMO ADMIN: Always show admin buttons for testing */}
                            {isOwner && (
                                <div className="mb-8 p-4 rounded-2xl bg-indigo-900/20 border border-indigo-500/30 flex justify-between items-center">
                                    <span className="text-indigo-300 font-bold text-sm flex items-center gap-2"><Settings className="w-4 h-4"/> {t.shop.seller}</span>
                                    <div className="flex gap-2">
                                        {products.length === 0 && <button onClick={seedDefaultProducts} className="px-4 py-2 bg-indigo-600 rounded-lg text-xs font-bold text-white hover:bg-indigo-500 transition-colors">{t.shop.loadDemo}</button>}
                                        <button onClick={() => setIsSellerMode(!isSellerMode)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isSellerMode ? 'bg-red-500/20 text-red-300' : 'bg-indigo-600 text-white'}`}>{isSellerMode ? t.shop.exit : t.shop.manage}</button>
                                    </div>
                                </div>
                            )}

                            {isOwner && isSellerMode ? (
                                <div className="space-y-8 animate-in slide-in-from-left duration-500">
                                    
                                    {/* 1. Dashboard Stats (Restored) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 rounded-3xl bg-indigo-900/20 border border-indigo-500/30 flex items-center justify-between">
                                            <div>
                                                <p className="text-indigo-300 text-xs font-bold uppercase">Total Products</p>
                                                <h3 className={`text-3xl font-bold text-white ${headingFont}`}>{products.length}</h3>
                                            </div>
                                            <Box className="w-10 h-10 text-indigo-400 opacity-50"/>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-between">
                                            <div>
                                                <p className="text-emerald-300 text-xs font-bold uppercase">Total Orders</p>
                                                <h3 className={`text-3xl font-bold text-white ${headingFont}`}>{shopOrders.length}</h3>
                                            </div>
                                            <ShoppingBag className="w-10 h-10 text-emerald-400 opacity-50"/>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* 2. Add/Edit Form */}
                                        <div className={`p-6 rounded-3xl bg-slate-950/50 border border-white/10 h-fit`}>
                                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                                                {editingProductId ? <Edit2 className="w-5 h-5 text-yellow-400"/> : <Plus className="w-5 h-5 text-emerald-400"/>}
                                                {editingProductId ? t.shop.edit : t.shop.add}
                                            </h3>
                                            <div className="space-y-4">
                                                <input type="text" placeholder={t.shop.name} value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className={`w-full px-4 py-3 rounded-xl ${glassInput}`} />
                                                <div className="flex gap-4">
                                                    <input type="number" placeholder={`Price (THB)`} value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className={`w-1/2 px-4 py-3 rounded-xl ${glassInput}`} />
                                                    <input type="text" placeholder={t.shop.cat} value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className={`w-1/2 px-4 py-3 rounded-xl ${glassInput}`} />
                                                </div>
                                                <input type="text" placeholder={t.shop.img} value={newProduct.image} onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} className={`w-full px-4 py-3 rounded-xl ${glassInput}`} />
                                                <div className="flex gap-3 pt-2">
                                                    {editingProductId && <button onClick={cancelEdit} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700">{t.shop.cancel}</button>}
                                                    <button onClick={handleSaveProduct} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg ${editingProductId ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{editingProductId ? t.shop.update : t.shop.create}</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. Inventory & Orders Column */}
                                        <div className="space-y-6">
                                            {/* Inventory List (Restored) */}
                                            <div className={`p-6 rounded-3xl bg-slate-950/50 border border-white/10`}>
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-400"/> {t.shop.inventory}</h3>
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                                    {products.map(p => (
                                                        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10">
                                                            <div className="flex items-center gap-3">
                                                                <img src={p.image} className="w-10 h-10 rounded-lg object-cover bg-slate-900" alt=""/>
                                                                <div>
                                                                    <div className="font-bold text-white text-sm line-clamp-1">{p.name}</div>
                                                                    <div className="text-[10px] text-slate-500">{p.category} • {p.price.toLocaleString()} THB</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => startEditProduct(p)} className="p-2 rounded-lg hover:bg-yellow-500/20 text-slate-400 hover:text-yellow-400 transition-colors"><Edit2 className="w-4 h-4"/></button>
                                                                <button onClick={() => deleteProduct(p.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Recent Orders (Restored & Enhanced) */}
                                            <div className={`p-6 rounded-3xl bg-slate-950/50 border border-white/10`}>
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-blue-400"/> {t.shop.recentOrders}</h3>
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                                    {shopOrders.length === 0 ? <p className="text-slate-500 text-sm text-center py-4">{t.wallet.noTx}</p> : shopOrders.map(order => (
                                                        <div key={order.id} className="p-4 rounded-xl bg-slate-900/50 border border-white/5 space-y-2">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="text-white font-bold text-sm">{order.details || "Unknown Items"}</div>
                                                                    <div className="text-[10px] text-slate-500">{t.shop.buyer}: {order.from.slice(0,6)}...</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-emerald-400 font-bold text-xs">{order.amount} {order.token}</div>
                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${order.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : order.status === 'rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'}`}>
                                                                        {order.status === 'paid' ? t.shop.paid : order.status === 'rejected' ? t.shop.rejected : t.shop.pending}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* ✅ Verify Slip Button */}
                                                            {order.slip && order.status === 'pending' && (
                                                                <div className="flex gap-2 pt-2 border-t border-white/5 mt-2">
                                                                    <button onClick={() => setSlipPreviewUrl(order.slip)} className="flex-1 py-1 bg-slate-800 text-[10px] rounded hover:bg-slate-700 flex items-center justify-center gap-1"><FileText className="w-3 h-3"/> {t.shop.viewSlip}</button>
                                                                    <button onClick={() => handleVerifyOrder(order.id, true)} className="flex-1 py-1 bg-emerald-600 text-[10px] rounded hover:bg-emerald-500 text-white flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3"/> {t.shop.approve}</button>
                                                                    <button onClick={() => handleVerifyOrder(order.id, false)} className="flex-1 py-1 bg-red-600 text-[10px] rounded hover:bg-red-500 text-white flex items-center justify-center gap-1"><XCircleIcon className="w-3 h-3"/> {t.shop.reject}</button>
                                                                </div>
                                                            )}

                                                            {order.shippingAddress && (
                                                                <div className="pt-2 border-t border-white/5 mt-2">
                                                                    <p className="text-[9px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1"><User className="w-3 h-3"/> {t.shop.shipping}</p>
                                                                    <p className="text-xs text-slate-300 whitespace-pre-wrap">{order.shippingAddress}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {products.filter(p => shopCategory === 'All' || p.category === shopCategory).map(product => (
                                        <div key={product.id} className={`rounded-3xl overflow-hidden bg-slate-950/40 border border-white/5 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(79,70,229,0.15)] transition-all duration-300 group flex flex-col relative`}>
                                            <div className="h-64 overflow-hidden relative">
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60"></div>
                                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/10 uppercase tracking-wide">{product.category}</div>
                                            </div>
                                            <div className="p-5 flex-1 flex flex-col relative -mt-12">
                                                <h3 className={`font-bold text-white text-xl leading-tight mb-1 ${headingFont} drop-shadow-md`}>{product.name}</h3>
                                                <div className="mt-auto pt-4 flex items-center justify-between">
                                                    <div className="text-emerald-400 font-bold font-mono text-lg">฿{product.price.toLocaleString()}</div>
                                                    <button onClick={() => addToCart(product)} className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-indigo-400 hover:text-white transition-colors shadow-lg group-active:scale-90"><Plus className="w-5 h-5"/></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {isCartOpen && (
                                <div className="absolute top-0 right-0 w-full md:w-96 h-full bg-[#0B0F19]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-30 p-8 flex flex-col animate-in slide-in-from-right duration-300 rounded-l-3xl">
                                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
                                        <h3 className={`text-2xl font-bold text-white ${headingFont}`}>{t.shop.cart}</h3>
                                        <button onClick={() => setIsCartOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6"/></button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                                        {cart.length === 0 ? <div className="text-center text-slate-600 py-20">{t.shop.emptyCart}</div> : cart.map(item => (
                                            <div key={item.id} className="flex gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                                                <img src={item.image} className="w-20 h-20 rounded-xl object-cover" alt="" />
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                                                    <p className="text-xs text-emerald-400 font-mono mb-2">฿{item.price.toLocaleString()}</p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center bg-black/40 rounded-lg p-1">
                                                            <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:text-white text-slate-500"><Minus className="w-3 h-3" /></button>
                                                            <span className="text-xs font-mono w-6 text-center">{item.qty}</span>
                                                            <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:text-white text-slate-500"><Plus className="w-3 h-3" /></button>
                                                        </div>
                                                        <button onClick={() => removeFromCart(item.id)} className="ml-auto text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 space-y-4 pt-6 border-t border-white/10">
                                        <div><label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">{t.shop.shipTo}</label><textarea placeholder="Address details..." value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className={`w-full p-3 rounded-xl text-sm h-20 resize-none ${glassInput}`}/></div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-2 block">{t.shop.payMethod}</label>
                                            <div className="w-full">
                                                 <button className={`w-full py-2 rounded-lg text-[10px] font-bold border transition-all bg-indigo-600 border-indigo-500 text-white`}>QR THB (PromptPay)</button>
                                            </div>
                                        </div>
                                        
                                        {/* ✅ Force show PromptPay section since it's the only option */}
                                        {cart.length > 0 && (
                                            <div className="bg-white p-4 rounded-xl flex flex-col items-center">
                                                <img src={`https://promptpay.io/${PROMPTPAY_ID}/${cartTotalTHB}.png`} alt="PromptPay" className="w-48 h-48 mix-blend-multiply" />
                                                <div className="text-slate-900 font-bold text-lg mt-2">{cartTotalTHB.toLocaleString()} THB</div>
                                                <div className="text-xs text-slate-500 mb-3">Scan to Pay</div>
                                                
                                                {/* ✅ Slip Upload Button */}
                                                <button onClick={() => slipInputRef.current?.click()} className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${paymentProof ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                                    <Upload className="w-4 h-4"/> {paymentProof ? "Slip Attached ✅" : "Upload Slip"}
                                                </button>
                                                <input type="file" ref={slipInputRef} onChange={handleSlipSelect} accept="image/*" className="hidden" />
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center text-sm pt-2">
                                            <span className="text-slate-400">{t.shop.total}</span>
                                            <span className="text-xl font-bold text-white font-mono">{cartTotalTHB.toLocaleString()} THB</span>
                                        </div>
                                        <button onClick={handleCheckout} disabled={cart.length === 0 || isLoading || !shippingAddress.trim()} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] ${paymentMethod === 'PROMPTPAY' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-indigo-600 hover:bg-indigo-500'} disabled:opacity-50`}>{isLoading ? t.shop.processing : t.shop.checkout}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ✅ News Tab - MANUAL POSTS ONLY */}
                    {activeTab === 'news' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <h2 className={`text-2xl font-bold text-white ${headingFont}`}>{t.news.title}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                     {isOwner && (
                                         <button onClick={() => setShowNewsForm(true)} className={`px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500`}>+ {t.news.postNews}</button>
                                     )}
                                </div>
                            </div>
                            
                            {/* Admin News Form */}
                            {showNewsForm && (
                                <div className={`p-6 rounded-3xl bg-slate-950/50 border border-white/10 mb-6 animate-in slide-in-from-top duration-300`}>
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                                        {t.news.postNews}
                                        <button onClick={() => setShowNewsForm(false)}><X className="w-5 h-5 text-slate-400"/></button>
                                    </h3>
                                    <div className="space-y-4">
                                        <input type="text" placeholder={t.news.newsTitle} value={newNews.title} onChange={(e) => setNewNews({...newNews, title: e.target.value})} className={`w-full px-4 py-3 rounded-xl ${glassInput}`} />
                                        <textarea placeholder={t.news.newsDesc} value={newNews.body} onChange={(e) => setNewNews({...newNews, body: e.target.value})} className={`w-full px-4 py-3 rounded-xl h-24 resize-none ${glassInput}`} />
                                        <div className="flex gap-4">
                                            <input type="text" placeholder={t.news.newsLink} value={newNews.url} onChange={(e) => setNewNews({...newNews, url: e.target.value})} className={`w-1/2 px-4 py-3 rounded-xl ${glassInput}`} />
                                            <input type="text" placeholder={t.shop.img} value={newNews.imageurl} onChange={(e) => setNewNews({...newNews, imageurl: e.target.value})} className={`w-1/2 px-4 py-3 rounded-xl ${glassInput}`} />
                                        </div>
                                        <input type="text" placeholder={t.news.newsSource} value={newNews.source} onChange={(e) => setNewNews({...newNews, source: e.target.value})} className={`w-full px-4 py-3 rounded-xl ${glassInput}`} />
                                        <button onClick={handlePostNews} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500">Post</button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {adminNews.length === 0 ? (
                                    <div className="col-span-full py-20 text-center text-slate-500">{t.news.loading}</div>
                                ) : (
                                    adminNews.map((item) => (
                                        <div key={item.id} className="block group h-full relative">
                                            <div className="h-full rounded-3xl bg-indigo-900/20 border border-indigo-500/30 overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1 relative">
                                                {isOwner && (
                                                    <button onClick={() => handleDeleteNews(item.id)} className="absolute top-2 right-2 z-20 p-2 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button>
                                                )}
                                                <div className="h-48 overflow-hidden relative">
                                                    <img src={item.imageurl || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt=""/>
                                                    <div className="absolute top-4 left-4 bg-indigo-600 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-bold flex items-center gap-1 shadow-lg">
                                                        <Star className="w-3 h-3 fill-current text-yellow-400"/>
                                                        {item.source_info?.name || "Official"}
                                                    </div>
                                                </div>
                                                <div className="p-6 flex-1 flex flex-col">
                                                    <h3 className={`text-lg font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors ${headingFont}`}>{item.title}</h3>
                                                    <p className="text-slate-400 text-xs line-clamp-3 mb-4 flex-1 leading-relaxed">{item.body}</p>
                                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs text-slate-500">
                                                        <span>{new Date(item.published_on * 1000).toLocaleDateString()}</span>
                                                        <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-indigo-400 font-bold hover:underline">
                                                            {t.news.read} <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Community Tab (Full Width) */}
                    {activeTab === 'community' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[750px]">
                            {/* Chat Area - Expanded to 12/12 (Full Width) */}
                            <div className="lg:col-span-12 flex flex-col h-full rounded-3xl bg-slate-950/30 border border-white/5 overflow-hidden shadow-xl">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <h3 className="font-bold text-white text-sm">{t.community.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-500 hidden sm:inline">{chatMessages.length} messages today</span>
                                        {/* ✅ Admin Refresh Button */}
                                        {isOwner && (
                                            <button onClick={refreshChat} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5" title="Refresh Chat">
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {chatMessages.map(msg => (
                                        <div key={msg.id} className={`flex gap-4 ${msg.sender === (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '') ? 'flex-row-reverse' : ''}`}>
                                            <img src={msg.avatar} className="w-10 h-10 rounded-full bg-slate-900 border border-white/10" alt=""/>
                                            <div className={`max-w-[70%] space-y-1`}>
                                                <div className={`flex items-center gap-2 ${msg.sender === (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '') ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-xs font-bold text-slate-300">{msg.sender}</span>
                                                    <span className="text-[10px] text-slate-600">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                </div>
                                                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.sender === (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '') ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                                                    {msg.image && <img src={msg.image} className="rounded-lg mb-2 max-h-60 object-cover" alt="attachment" />}
                                                    {msg.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef}></div>
                                </div>
                                <div className="p-4 bg-white/5 border-t border-white/5">
                                    {selectedImage && <div className="mb-2 p-2 bg-slate-900 rounded-lg flex justify-between items-center"><span className="text-xs text-slate-400">Image attached</span><button onClick={() => setSelectedImage(null)}><X className="w-4 h-4 text-slate-500"/></button></div>}
                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"><ImageIcon className="w-5 h-5"/></button>
                                        <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                                        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={t.community.typeMsg} className={`flex-1 px-4 rounded-xl ${glassInput}`} />
                                        <button type="submit" disabled={(!chatInput.trim() && !selectedImage)} className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"><Send className="w-5 h-5"/></button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Donate Tab */}
                    {activeTab === 'donate' && (
                        <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in zoom-in duration-300">
                            <div className="relative">
                                <div className="absolute inset-0 bg-pink-500 blur-3xl opacity-20 rounded-full"></div>
                                <Heart className="w-24 h-24 text-pink-500 relative z-10 drop-shadow-2xl fill-current" />
                            </div>
                            <div className="text-center max-w-md">
                                <h2 className={`text-4xl font-bold text-white mb-3 ${headingFont}`}>{t.donate.title}</h2>
                                <p className="text-slate-400">{t.donate.desc}</p>
                            </div>
                            
                            <div className="w-full max-w-md bg-slate-950/50 p-8 rounded-3xl border border-white/10 space-y-6">
                                <div className="flex p-1 bg-slate-900 rounded-xl">
                                    {['NATIVE', 'ERC20', 'PROMPTPAY'].map(t => (
                                        <button key={t} onClick={() => setDonateType(t)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${donateType === t ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{t === 'PROMPTPAY' ? 'QR' : t === 'NATIVE' ? nativeTicker : t}</button>
                                    ))}
                                </div>
                                {donateType === 'PROMPTPAY' && amount && (
                                    <div className="flex justify-center p-4 bg-white rounded-xl">
                                        <img src={`https://promptpay.io/${PROMPTPAY_ID}/${amount}.png`} className="w-32 h-32 mix-blend-multiply" alt="QR"/>
                                    </div>
                                )}
                                {donateType === 'ERC20' && <input type="text" placeholder={t.wallet.tokenAddr} value={donateTokenAddress} onChange={(e) => setDonateTokenAddress(e.target.value)} className={`w-full px-4 py-3 rounded-xl ${glassInput}`} />}
                                <div className="relative">
                                    <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full pl-4 pr-16 py-4 rounded-xl bg-slate-900 border border-white/10 focus:border-pink-500 text-2xl font-mono font-bold text-white outline-none text-center`} />
                                    <span className="absolute right-4 top-5 text-sm font-bold text-slate-500">{donateType === 'PROMPTPAY' ? 'THB' : 'AMT'}</span>
                                </div>
                                <button onClick={handleDonate} disabled={isLoading || !amount} className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold shadow-lg shadow-pink-900/20 active:scale-95 transition-all">
                                    {isLoading ? t.shop.processing : t.donate.confirm}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Admin Tab */}
                    {activeTab === 'admin' && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-4">
                                <AlertTriangle className="w-8 h-8 text-yellow-500"/>
                                <div>
                                    <h3 className="font-bold text-yellow-500">{t.admin.title}</h3>
                                    <p className="text-xs text-yellow-200/50">{t.admin.desc}</p>
                                </div>
                            </div>
                            
                            {/* UID Helper for Rules */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                <div className="text-xs text-slate-400">
                                    Your UID (For Security Rules): <span className="font-mono text-emerald-400">{firebaseUser?.uid}</span>
                                </div>
                                <button onClick={() => copyToClipboard(firebaseUser?.uid)} className="p-1 hover:bg-white/10 rounded"><Copy className="w-3 h-3"/></button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={`p-8 rounded-3xl ${glassPanel}`}>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">{t.admin.updateFee}</label>
                                    <div className="flex gap-3">
                                        <input type="number" placeholder="Current: 20" value={newFee} onChange={(e) => setNewFee(e.target.value)} className={`flex-1 px-4 py-3 rounded-xl ${glassInput}`} />
                                        <button onClick={handleUpdateFee} className={`px-6 rounded-xl font-bold ${glassButton}`}>{t.admin.update}</button>
                                    </div>
                                </div>
                                <div className={`p-8 rounded-3xl ${glassPanel}`}>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">{t.admin.changeTreasury}</label>
                                    <div className="flex gap-3">
                                        <input type="text" placeholder="0x..." value={newTreasury} onChange={(e) => setNewTreasury(e.target.value)} className={`flex-1 px-4 py-3 rounded-xl ${glassInput}`} />
                                        <button onClick={handleUpdateTreasury} className={`px-6 rounded-xl font-bold ${glassButton}`}>{t.admin.update}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Toast */}
                    {statusMsg && (
                        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 flex items-center gap-3 ${statusType === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'}`}>
                            {statusType === 'error' ? <AlertTriangle className="w-4 h-4"/> : <Check className="w-4 h-4"/>}
                            <span className="font-bold text-sm">{statusMsg}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;