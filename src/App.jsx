import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, ArrowRightLeft, Heart, Settings, Shield, RefreshCw, Copy, Check, 
  AlertTriangle, Users, QrCode, TrendingUp, Search, Coins, LineChart, 
  BarChart2, Globe, Activity, DollarSign, BarChart4, Gauge, LogOut, 
  Newspaper, Clock, ExternalLink, MessageSquare, Send, Image as ImageIcon, X,
  ShoppingBag, ShoppingCart, CreditCard, Package, Plus, Minus, Trash2, Smartphone,
  Bot, Sparkles, Zap, MessageCircle, History, Bell, Box, Edit2, Save, Lock,
  Gamepad2, Trophy, Rocket, Gem, Gift, Brain, HelpCircle, 
  Egg, Utensils, Moon, Sun, Smile, Flame // ✅ เพิ่มไอคอนสำหรับเกม BoomPet
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'; 
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';

const App = () => {
  // --- Configuration ---
  const DEFAULT_CONTRACT_ADDRESS = "0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B"; 
  
  // 💰 กระเป๋า Admin หลัก (รับเงินค่าของ + บริจาค + ค่าธรรมเนียม)
  const SHOP_WALLET_ADDRESS = "0x32827b005cda325C2da1c290e303D860aFeceFfe"; 
  
  const PROMPTPAY_ID = "0950524447"; 
  const USD_THB_RATE = 35.5; 

  // 🛡️ ADMIN LIST: ผู้ที่มีสิทธิ์ควบคุมระบบร้านค้าและแก้ไขข้อมูล
  // ⚠️ สำคัญ: เฉพาะ Wallet ที่ระบุในนี้เท่านั้นที่มีอำนาจสูงสุด (เจ้าของสัญญาไม่มีสิทธิ์ถ้าไม่อยู่ในนี้)
  const ADMIN_WALLETS = [
      "0x32827b005cda325C2da1c290e303D860aFeceFfe", 
      "0x32827b005cda325C2da1c290e303D860aFeceFfe", // 👈 ใส่ Wallet ของคุณที่นี่
  ];

  // --- Firebase Setup ---
  const [firebaseApp, setFirebaseApp] = useState(null);
  const [db, setDb] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [dbError, setDbError] = useState(null); 
  
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
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

  // Wallet Tab State
  const [walletMode, setWalletMode] = useState("transfer"); 

  // Form Data
  const [transferType, setTransferType] = useState("ETH");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  // const [referrer, setReferrer] = useState(""); // ❌ ลบ state referrer ออก เพราะเราจะบังคับใช้ Admin
  const [donateType, setDonateType] = useState("ETH");
  const [donateTokenAddress, setDonateTokenAddress] = useState("");
  
  // Shop State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shopCategory, setShopCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("ETH"); 
  const [usdtAddress, setUsdtAddress] = useState(""); 
  const [isSellerMode, setIsSellerMode] = useState(false); 
  const [shopOrders, setShopOrders] = useState([]); 

  // New Product State
  const [newProduct, setNewProduct] = useState({ name: "", price: "", category: "Merch", image: "" });
  const [editingProductId, setEditingProductId] = useState(null);
  
  // ✅ เพิ่ม State สำหรับที่อยู่จัดส่ง
  const [shippingAddress, setShippingAddress] = useState("");

  // --- Game State (BoomPet / Digimon) ---
  const [gameScore, setGameScore] = useState(1000); // BoomPoints
  const [pet, setPet] = useState({
      name: "Egg",
      stage: "egg", // egg, baby, rookie, champion, ultimate
      hunger: 100, // Max 100
      energy: 100, // Max 100
      happiness: 100, // Max 100
      exp: 0,
      age: 0,
      isSleeping: false,
      lastTick: Date.now()
  });

  const PET_STAGES = {
      egg: { name: "DigiEgg", icon: Egg, color: "text-slate-400", next: "baby", reqExp: 10 },
      baby: { name: "Botamon", icon: Smile, color: "text-pink-400", next: "rookie", reqExp: 100 },
      rookie: { name: "Agumon", icon: Flame, color: "text-orange-500", next: "champion", reqExp: 300 },
      champion: { name: "Greymon", icon: Zap, color: "text-blue-500", next: "ultimate", reqExp: 800 },
      ultimate: { name: "WarGreymon", icon: Trophy, color: "text-yellow-400", next: null, reqExp: 9999 }
  };

  // --- Game Logic ---
  // 1. Time Loop (หิวและง่วงตามเวลา)
  useEffect(() => {
      const interval = setInterval(() => {
          if (pet.stage === 'egg') return; // ไข่ไม่มีสเตตัสลด

          setPet(prev => {
              if (prev.isSleeping) {
                  // ตอนนอน: ฟื้นพลังไว, หิวช้า
                  const newEnergy = Math.min(100, prev.energy + 5);
                  const newHunger = Math.max(0, prev.hunger - 1);
                  
                  if (newEnergy >= 100 && prev.energy < 100) {
                      showStatus("ตื่นแล้ว! พลังเต็มเปี่ยม", "success");
                      return { ...prev, energy: 100, hunger: newHunger, isSleeping: false };
                  }
                  return { ...prev, energy: newEnergy, hunger: newHunger };
              } else {
                  // ตอนตื่น: ลดค่าต่างๆ
                  const newHunger = Math.max(0, prev.hunger - 2);
                  const newHappiness = Math.max(0, prev.happiness - 1);
                  const newEnergy = Math.max(0, prev.energy - 1);
                  return { ...prev, hunger: newHunger, happiness: newHappiness, energy: newEnergy };
              }
          });
      }, 3000); // ทุก 3 วินาที

      return () => clearInterval(interval);
  }, [pet.stage, pet.isSleeping]);

  // 2. Actions
  const handleAction = (action) => {
      if (!account) return showStatus("Login First!", "error");
      if (pet.stage === 'egg' && action !== 'hatch') return showStatus("ต้องฟักไข่ก่อน!", "error");
      if (pet.isSleeping && action !== 'wake') return showStatus("น้องหลับอยู่... zZZ", "info");

      setPet(prev => {
          let next = { ...prev };
          switch (action) {
              case 'hatch':
                  if (prev.stage !== 'egg') return prev;
                  next.exp += 5;
                  if (next.exp >= PET_STAGES.egg.reqExp) {
                      next.stage = 'baby';
                      next.exp = 0;
                      showStatus("ไข่ฟักแล้ว! ยินดีด้วย", "success");
                  } else {
                      showStatus("กำลังฟัก... เขย่าๆ", "info");
                  }
                  break;
              case 'feed':
                  if (prev.hunger >= 100) return prev;
                  next.hunger = Math.min(100, prev.hunger + 30);
                  next.exp += 5;
                  showStatus("Yummy! อร่อยจัง (+Exp)", "success");
                  break;
              case 'train':
                  if (prev.energy < 20) {
                      showStatus("เหนื่อยแล้ว! ต้องพักผ่อน", "error");
                      return prev;
                  }
                  next.energy -= 20;
                  next.happiness = Math.min(100, prev.happiness + 10);
                  next.exp += 15;
                  showStatus("Training! แข็งแกร่งขึ้น (+Exp)", "success");
                  break;
              case 'sleep':
                  next.isSleeping = true;
                  showStatus("Good Night! zZZ", "info");
                  break;
              case 'wake':
                  next.isSleeping = false;
                  showStatus("ตื่นแล้ว!", "info");
                  break;
              default:
                  break;
          }

          // Check Evolution
          const currentStageData = PET_STAGES[next.stage];
          if (currentStageData.next && next.exp >= currentStageData.reqExp) {
              const nextStageKey = currentStageData.next;
              const nextStageData = PET_STAGES[nextStageKey];
              next.stage = nextStageKey;
              next.exp = 0; // Reset EXP for next level
              next.happiness = 100;
              next.energy = 100;
              next.hunger = 100;
              
              // Give Reward
              const reward = 500;
              setGameScore(s => s + reward);
              showStatus(`🎉 EVOLUTION! เปลี่ยนร่างเป็น ${nextStageData.name} (+${reward} BP)`, "success");
          }

          return next;
      });
  };

  const handleFaucet = () => {
      setGameScore(prev => prev + 500);
      showStatus("รับฟรี 500 BP สำเร็จ!", "success");
  };

  // AI Chatbot State
  const [isAiChatOpen, setIsAiChatOpen] = useState(false); 
  const [aiMessages, setAiMessages] = useState([
    { id: 1, sender: 'bot', text: 'สวัสดีครับ! ผมคือ BoomBot AI (Powered by Gemini) 🤖 ผู้ช่วยอัจฉริยะของคุณ ถามเรื่องราคาเหรียญ วิเคราะห์กราฟ หรือความรู้ Crypto ได้เลยครับ!' }
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

  // Market Data
  const [selectedCoin, setSelectedCoin] = useState("ethereum"); 
  const [coinSymbol, setCoinSymbol] = useState("ETH"); 
  const [isCustomSymbol, setIsCustomSymbol] = useState(false);
  const [coinInput, setCoinInput] = useState("");
  const [coinImage, setCoinImage] = useState("https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [marketStats, setMarketStats] = useState({ marketCap: 0, totalVolume: 0, high24h: 0, low24h: 0, ath: 0 });
  const [fearGreed, setFearGreed] = useState({ value: 0, status: "Neutral" });

  // News Data
  const [newsData, setNewsData] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);

  // Admin
  const [newFee, setNewFee] = useState("");
  const [newTreasury, setNewTreasury] = useState("");

  // Initial Products
  const [products, setProducts] = useState([
    { id: 1, name: "BoomTech Hoodie", price: 0.035, category: "Merch", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=500&q=80" },
    { id: 2, name: "Hardware Wallet X", price: 0.08, category: "Gadget", image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=500&q=80" },
    { id: 3, name: "VIP Signal (1 Month)", price: 0.05, category: "Digital", image: "https://images.unsplash.com/photo-1611974765270-ca12586343bb?auto=format&fit=crop&w=500&q=80" },
    { id: 4, name: "Mining Rig Frame", price: 0.12, category: "Mining", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80" },
    { id: 5, name: "Trading Course", price: 0.02, category: "Digital", image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=500&q=80" },
    { id: 6, name: "NFT Art #888", price: 0.5, category: "NFT", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=500&q=80" }
  ]);

  const quickCoins = [
    { symbol: 'BTC', id: 'bitcoin' },
    { symbol: 'ETH', id: 'ethereum' },
    { symbol: 'BNB', id: 'binancecoin' },
    { symbol: 'SOL', id: 'solana' },
    { symbol: 'DOGE', id: 'dogecoin' },
    { symbol: 'GOLD', custom: 'OANDA:XAUUSD' }, 
    { symbol: 'AAPL', custom: 'NASDAQ:AAPL' }    
  ];

  // Constants for Glassmorphism Styles (from index.css integration)
  const glassPanel = "bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl";
  const glassButton = "bg-white/5 hover:bg-white/10 border border-white/5 backdrop-blur-md transition-all active:scale-95 text-slate-200";
  const glassInput = "bg-slate-950/50 border border-white/10 focus:border-cyan-500/50 outline-none transition-all text-slate-200 placeholder-slate-500";
  const headingFont = "font-['Sora'] tracking-tight";
  const bodyFont = "font-['Outfit']";

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
      // กรณีรันใน Preview (Canvas)
      if (typeof __firebase_config !== 'undefined') {
        config = JSON.parse(__firebase_config);
      } else {
        // Fallback for Vercel/Local
        config = {
          apiKey: "AIzaSyDqbllQ68zYTPag1UdjM2klTEBDd43wDAk", 
          authDomain: "boomwallet-2583b.firebaseapp.com",
          projectId: "boomwallet-2583b",
          storageBucket: "boomwallet-2583b.firebasestorage.app",
          messagingSenderId: "1032978734418",
          appId: "1:1032978734418:web:50605af806581bf4a86e8b"
        };
      }

      if (!config) return;

      const app = initializeApp(config);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);
      
      setFirebaseApp(app);
      setDb(dbInstance);

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
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase init error", e);
      setDbError("Firebase Init Error: " + e.message);
    }
  }, []);

  // --- Real-time Listeners (With Error Handling) ---
  useEffect(() => {
    // ✅ Check for firebaseUser to prevent permission errors
    if (!db || !appId || !firebaseUser) return;
    setDbError(null); 

    // 1. Chat Listener
    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'community_chat');
    const unsubChat = onSnapshot(chatRef, (snapshot) => {
      // ✅ Logic: รีเซ็ตแชททุก 1 ชั่วโมง (แสดงเฉพาะข้อความที่ใหม่กว่า 1 ชม. ล่าสุด)
      const ONE_HOUR_MS = 60 * 60 * 1000;
      const cutoffTime = Date.now() - ONE_HOUR_MS;

      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(msg => msg.timestamp > cutoffTime); // กรองข้อความเก่าทิ้ง

      msgs.sort((a, b) => a.timestamp - b.timestamp);
      setChatMessages(msgs);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, (error) => {
       console.log("Chat listener error:", error.message);
       if (error.code === 'permission-denied') {
           setDbError("Permission Denied: โปรดตรวจสอบ Firestore Rules ใน Firebase Console (ต้องเปิด allow read/write)");
       }
    });

    // 2. Transaction History Listener
    const txRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    const unsubTx = onSnapshot(txRef, (snapshot) => {
        const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        txs.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(txs.slice(0, 10)); 
        const orders = txs.filter(t => t.type === 'SHOP_BUY' || t.type === 'SHOP_BUY_QR');
        setShopOrders(orders);
    }, (error) => {
       console.log("Tx listener error:", error.message);
    });

    return () => {
        unsubChat();
        unsubTx();
    };
  }, [db, appId, firebaseUser]); 

  // ✅ Auto-Cleanup: ตรวจสอบและลบข้อความที่เก่าเกิน 1 ชั่วโมงออกจากหน้าจอทุกๆ 1 นาที
  useEffect(() => {
    const interval = setInterval(() => {
        setChatMessages(prevMessages => {
            const cutoff = Date.now() - (60 * 60 * 1000);
            // ถ้ามีข้อความเก่า ให้กรองออกและอัปเดต state
            const filtered = prevMessages.filter(msg => msg.timestamp > cutoff);
            if (filtered.length !== prevMessages.length) {
                return filtered;
            }
            return prevMessages;
        });
    }, 60000); // ทำงานทุก 60 วินาที

    return () => clearInterval(interval);
  }, []);

  // --- Initialize Ethers ---
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

  // --- Wallet Connection & Auto-Refresh Balance ---
  useEffect(() => {
    if (window.ethereum && ethersLib) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
          if (accounts.length > 0) connectWallet();
      });
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) { setAccount(accounts[0]); window.location.reload(); } 
        else { setAccount(""); setSigner(null); setBalance("0.0000"); }
      });
    }
  }, [ethersLib]);

  // ✅ Auto-Polling: Check Balance every 15 seconds
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

  // Token Balance Check
  useEffect(() => {
      const fetchTokenBal = async () => {
          if (!account || !ethersLib || !ethersLib.utils.isAddress(tokenAddress)) return;
          try {
              const tokenContract = new ethersLib.Contract(tokenAddress, erc20ABI, provider);
              const bal = await tokenContract.balanceOf(account);
              const dec = await tokenContract.decimals();
              setTokenBalance(ethersLib.utils.formatUnits(bal, dec));
          } catch (e) { setTokenBalance("0.00"); }
      };
      fetchTokenBal();
  }, [tokenAddress, account, ethersLib, provider]);


  // Update Data based on Tab
  useEffect(() => {
    if (activeTab === 'market') {
      fetchGlobalData();
      if (!isCustomSymbol) {
        fetchPriceData();
        const interval = setInterval(fetchPriceData, 30000); 
        return () => clearInterval(interval);
      }
    } else if (activeTab === 'news') {
      fetchNews();
    }
  }, [activeTab, selectedCoin, isCustomSymbol]);

  // --- Core Functions ---
  const connectWallet = async () => {
    // ✅ 1. ตรวจสอบ Provider: รองรับทั้ง MetaMask และ Binance Web3 Wallet
    let walletProvider = window.ethereum;
    
    // ถ้าไม่เจอ ethereum ให้ลองหา BinanceChain (สำหรับ Extension)
    if (!walletProvider && window.BinanceChain) {
        walletProvider = window.BinanceChain;
    }

    // ✅ ปรับข้อความแจ้งเตือนให้รวม MetaMask
    if (!walletProvider) return alert("ไม่พบกระเป๋าเงิน! กรุณาติดตั้ง MetaMask หรือ Binance Wallet");
    if (!ethersLib) return showStatus("กำลังโหลดระบบ...", "info");
    
    try {
      const provider = new ethersLib.providers.Web3Provider(walletProvider);
      
      // ✅ 2. ขอสิทธิ์เชื่อมต่อ (รองรับทั้ง method request และ send)
      if (walletProvider.request) {
        await walletProvider.request({ method: 'eth_requestAccounts' });
      } else {
        await provider.send("eth_requestAccounts", []);
      }

      const signer = provider.getSigner();
      const addr = await signer.getAddress();
      const rawBalance = await provider.getBalance(addr);
      
      setProvider(provider);
      setSigner(signer);
      setAccount(addr);
      setBalance(parseFloat(ethersLib.utils.formatEther(rawBalance)).toFixed(4));
      
      checkOwner(addr, provider, ethersLib);
      showStatus("เชื่อมต่อกระเป๋าสำเร็จ! ✅", "success");

    } catch (err) { 
        console.error(err);
        showStatus("เชื่อมต่อล้มเหลว: " + (err.message || err), "error"); 
    }
  };

  const checkOwner = async (addr, provider, lib) => {
    const currentAddr = addr.toLowerCase().trim();
    console.log("Checking permissions for:", currentAddr);

    // ✅ 1. ตรวจสอบจากรายชื่อ Admin ที่กำหนดไว้ในโค้ดเท่านั้น (ปลอดภัยที่สุด)
    // อำนาจสูงสุดจะอยู่ที่รายชื่อใน ADMIN_WALLETS เท่านั้น
    const isAdminWallet = ADMIN_WALLETS.some(admin => admin.toLowerCase().trim() === currentAddr);
    
    if (isAdminWallet) {
        console.log("✅ ACCESS GRANTED: User is a Super Admin.");
        setIsOwner(true);
        return;
    }

    // ❌ ลบการตรวจสอบเจ้าของ Smart Contract ทิ้งถาวร
    // เพื่อให้แน่ใจว่าเจ้าของสัญญา (Contract Owner) ไม่มีสิทธิ์ใดๆ หากไม่ได้อยู่ในรายชื่อ ADMIN_WALLETS
    
    console.log("❌ User is NOT Admin");
    setIsOwner(false);
  };

  const showStatus = (msg, type = "info") => {
    const safeMsg = typeof msg === 'object' ? JSON.stringify(msg) : String(msg);
    setStatusMsg(safeMsg);
    setStatusType(type);
    if (type === "success") setTimeout(() => setStatusMsg(""), 5000);
  };

  // ✅ อัปเดตฟังก์ชัน recordTransaction ให้รองรับ shippingAddress
  const recordTransaction = async (type, amount, token, to, details = "", shippingAddress = null) => {
      if (!db || !appId || !firebaseUser) return; 
      try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), {
              type, amount, token, to, details, shippingAddress, // บันทึกที่อยู่ลง database แทนการส่งเข้าแชท
              from: account,
              timestamp: Date.now()
          });
      } catch (e) { console.error("Log tx error", e); }
  };

  // ✅ Force funds to go to Admin Treasury (SHOP_WALLET_ADDRESS)
  const getRecipientAddress = () => {
      // Priority 1: SHOP_WALLET_ADDRESS (Configured Treasury)
      if (ethersLib.utils.isAddress(SHOP_WALLET_ADDRESS)) return SHOP_WALLET_ADDRESS;
      
      // Priority 2: Fallback to the first Admin in the list
      if (ADMIN_WALLETS.length > 0 && ethersLib.utils.isAddress(ADMIN_WALLETS[0])) return ADMIN_WALLETS[0];
      
      // Critical Fallback (Should not happen in Prod): Burn address or Developer address
      return "0x000000000000000000000000000000000000dEaD"; 
  };

  // ✅ FIXED: Missing handleTransfer function added
  const handleTransfer = async () => {
    if (!contractAddress) return showStatus("กรุณาระบุ Contract Address", "error");
    if (!recipient || !amount) return showStatus("กรุณากรอกข้อมูลให้ครบ", "error");
    if (!ethersLib) return;
    setIsLoading(true);
    showStatus("กำลังดำเนินการ...", "info");
    try {
      const contract = new ethersLib.Contract(contractAddress, contractABI, signer);
      // ✅ FORCE REFERRAL: บังคับให้ผู้แนะนำเป็นกระเป๋า Admin เสมอ
      // ไม่ว่าใครจะโอนเงิน ค่าธรรมเนียมแนะนำ (ถ้ามี) จะวิ่งเข้า Admin ทันที
      const refAddr = SHOP_WALLET_ADDRESS; 
      
      if (transferType === "ETH") {
        const tx = await contract.transferETHWithReferral(recipient, refAddr, { value: ethersLib.utils.parseEther(amount) });
        await tx.wait();
        recordTransaction("TRANSFER_ETH", amount, "ETH", recipient);
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

  // --- Shop Functions ---
  const handleSaveProduct = () => {
      if (!newProduct.name || !newProduct.price) return showStatus("กรุณากรอกชื่อและราคา", "error");
      
      if (editingProductId) {
          // Update existing
          setProducts(prev => prev.map(p => p.id === editingProductId ? { 
              ...newProduct, 
              id: editingProductId,
              price: parseFloat(newProduct.price),
              image: newProduct.image || "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=500&q=80"
          } : p));
          showStatus("แก้ไขสินค้าเรียบร้อย ✅", "success");
          setEditingProductId(null);
      } else {
          // Add new
          const product = {
              id: Date.now(),
              ...newProduct,
              price: parseFloat(newProduct.price),
              image: newProduct.image || "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=500&q=80"
          };
          setProducts(prev => [product, ...prev]);
          showStatus("เพิ่มสินค้าเรียบร้อย ✅", "success");
      }
      setNewProduct({ name: "", price: "", category: "Merch", image: "" });
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

  const deleteProduct = (id) => {
      if(editingProductId === id) cancelEdit();
      setProducts(prev => prev.filter(p => p.id !== id));
      showStatus("ลบสินค้าแล้ว", "info");
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

  const cartTotalETH = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const ethToUsd = currentPrice > 0 ? currentPrice : 3000; 
  const cartTotalTHB = Math.ceil(cartTotalETH * ethToUsd * USD_THB_RATE);

  const handleCheckout = async () => {
    if (!account && paymentMethod !== 'PROMPTPAY') return showStatus("กรุณาเชื่อมต่อกระเป๋าก่อนชำระเงิน", "error");
    if (cart.length === 0) return;
    if (!ethersLib && paymentMethod !== 'PROMPTPAY') return;
    
    // ✅ เพิ่ม Validation: ต้องกรอกที่อยู่ก่อน
    if (!shippingAddress.trim()) return showStatus("กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน", "error");

    setIsLoading(true);
    showStatus("กำลังดำเนินการชำระเงิน...", "info");

    const itemsSummary = cart.map(i => `${i.name} (x${i.qty})`).join(', ');
    const targetAddress = getRecipientAddress(); // ✅ Always sends to Admin Treasury

    try {
        if (paymentMethod === 'ETH') {
            const tx = await signer.sendTransaction({ to: targetAddress, value: ethersLib.utils.parseEther(cartTotalETH.toFixed(6).toString()) });
            showStatus("รอการยืนยันธุรกรรม ETH...", "info");
            await tx.wait();
            // ✅ ส่ง shippingAddress ไปบันทึกใน Transaction
            recordTransaction("SHOP_BUY", cartTotalETH.toFixed(6), "ETH", targetAddress, itemsSummary, shippingAddress);
        } 
        else if (paymentMethod === 'USDT') {
            if (!usdtAddress) throw new Error("กรุณาระบุ USDT Contract Address");
            const tokenContract = new ethersLib.Contract(usdtAddress, erc20ABI, signer);
            const decimals = await tokenContract.decimals();
            const usdValue = cartTotalETH * ethToUsd;
            const amountWei = ethersLib.utils.parseUnits(usdValue.toFixed(2).toString(), decimals);
            
            const userTokenBalance = await tokenContract.balanceOf(account);
            if (userTokenBalance.lt(amountWei)) {
                const readableBalance = ethersLib.utils.formatUnits(userTokenBalance, decimals);
                throw new Error(`ยอดเงิน USDT ไม่เพียงพอ (ต้องการ: ${usdValue.toFixed(2)}, มี: ${parseFloat(readableBalance).toFixed(2)})`);
            }

            const tx = await tokenContract.transfer(targetAddress, amountWei); 
            showStatus("รอการยืนยันธุรกรรม USDT...", "info");
            await tx.wait();
            // ✅ ส่ง shippingAddress ไปบันทึกใน Transaction
            recordTransaction("SHOP_BUY", usdValue.toFixed(2), "USDT", targetAddress, itemsSummary, shippingAddress);
        }
        else if (paymentMethod === 'PROMPTPAY') {
            await new Promise(r => setTimeout(r, 2000));
            // ✅ ส่ง shippingAddress ไปบันทึกใน Transaction
            recordTransaction("SHOP_BUY_QR", cartTotalTHB, "THB", "PromptPay", itemsSummary, shippingAddress);
        }

        showStatus("ชำระเงินสำเร็จ! ขอบคุณที่อุดหนุน 🎉", "success");
        
        const buyerName = account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Guest Customer";
        
        // ✅ ปรับข้อความในแชท: ลบที่อยู่ออกเพื่อความเป็นส่วนตัว (Privacy Protected)
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'community_chat'), {
            text: `🛍️ **NEW ORDER RECEIVED!**\n\n👤 Buyer: ${buyerName}\n📦 Items:\n${itemsSummary.replace(/, /g, '\n')}\n💰 Total: ${paymentMethod === 'PROMPTPAY' ? `${cartTotalTHB.toLocaleString()} THB` : `${cartTotalETH.toFixed(4)} ETH`}\n💳 via ${paymentMethod}\n✅ *Shipping details sent to seller*`,
            sender: "BoomShop Bot 🤖",
            isWallet: false,
            avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=BoomShop",
            timestamp: Date.now()
        });

        setCart([]);
        setShippingAddress(""); 
        setIsCartOpen(false);
        
        if (paymentMethod !== 'PROMPTPAY') {
             const newBal = await provider.getBalance(account);
             setBalance(parseFloat(ethersLib.utils.formatEther(newBal)).toFixed(4));
        }
    } catch (err) {
        console.error("Checkout error:", err);
        showStatus("การชำระเงินล้มเหลว: " + (err.reason || err.message), "error");
    } finally {
        setIsLoading(false);
    }
  };

  // ✅ New Function: Donate Directly to Treasury
  const handleDonate = async () => {
    const targetAddress = getRecipientAddress(); // ✅ Always sends to Admin Treasury
    
    if (!ethersLib) return;
    setIsLoading(true);
    
    try {
      if (donateType === "ETH") {
        const tx = await signer.sendTransaction({
            to: targetAddress,
            value: ethersLib.utils.parseEther(amount)
        });
        await tx.wait();
        recordTransaction("DONATE_ETH", amount, "ETH", "Treasury");
      } else {
        const tokenContract = new ethersLib.Contract(donateTokenAddress, erc20ABI, signer);
        const decimals = await tokenContract.decimals();
        const amountWei = ethersLib.utils.parseUnits(amount, decimals);
        
        const bal = await tokenContract.balanceOf(account);
        if (bal.lt(amountWei)) throw new Error("ยอดเงิน Token ไม่เพียงพอสำหรับการบริจาค");

        const tx = await tokenContract.transfer(targetAddress, amountWei);
        await tx.wait();
        recordTransaction("DONATE_TOKEN", amount, "TOKEN", "Treasury");
      }
      showStatus("ขอบคุณสำหรับการบริจาค! 🙏 (เงินเข้ากระเป๋า Admin แล้ว)", "success");
      setAmount("");
    } catch (err) { 
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
        setMarketStats(prev => ({ ...prev, marketCap: data[selectedCoin].usd_market_cap, totalVolume: data[selectedCoin].usd_24h_vol }));
      }
      const detailRes = await fetch(`https://api.coingecko.com/api/v3/coins/${selectedCoin}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
      const detailData = await detailRes.json();
      if (detailData.symbol) {
          setCoinSymbol(detailData.symbol.toUpperCase());
          if (detailData.image?.large) setCoinImage(detailData.image.large);
          if (detailData.market_data) setMarketStats(prev => ({ ...prev, high24h: detailData.market_data.high_24h.usd, low24h: detailData.market_data.low_24h.usd, ath: detailData.market_data.ath.usd }));
      }
    } catch (e) { console.error("Price data error", e); }
    finally { setTimeout(() => setIsMarketLoading(false), 500); } 
  };

  const fetchGlobalData = async () => {
      try { const fgRes = await fetch("https://api.alternative.me/fng/?limit=1"); const fgData = await fgRes.json(); if (fgData.data && fgData.data.length > 0) setFearGreed({ value: parseInt(fgData.data[0].value), status: fgData.data[0].value_classification }); } catch (e) {}
  };

  // ✅ เปลี่ยนแหล่งข่าวเป็น Cointelegraph (API Source)
  const fetchNews = async () => {
      setIsNewsLoading(true);
      const fallbackNews = [{ id: 'backup-1', title: "Crypto Market Update", body: "The cryptocurrency market remains volatile...", imageurl: "https://images.unsplash.com/photo-1621504450168-38f684489e05", url: "#", source_info: { name: "Cointelegraph", img: "" }, published_on: Date.now() / 1000 }];
      
      try {
          // ใช้ RSS Feed ของ Cointelegraph ผ่าน rss2json
          const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss');
          const data = await res.json();
          
          if (data.status === 'ok' && data.items.length > 0) {
              const formattedNews = data.items.map(item => ({ 
                id: item.guid, 
                title: item.title, 
                body: item.description.replace(/<[^>]*>/g, '').slice(0, 150) + "...", // ลบ HTML tags ออกจากเนื้อหา
                imageurl: item.enclosure?.link || item.thumbnail || "https://cointelegraph.com/assets/img/default.png", 
                url: item.link, 
                source_info: { name: "Cointelegraph", img: "https://cointelegraph.com/favicon.ico" }, 
                published_on: new Date(item.pubDate).getTime() / 1000 
              }));
              setNewsData(formattedNews);
          } else { setNewsData(fallbackNews); }
      } catch (error) { 
          console.error("News fetch error:", error);
          setNewsData(fallbackNews); 
      } finally { 
          setIsNewsLoading(false); 
      }
  };

  const handleSearchCoin = async (e) => {
    e.preventDefault();
    if (!coinInput.trim()) return;
    if (coinInput.includes(':') || !/^[a-zA-Z0-9]+$/.test(coinInput)) { setCoinSymbol(coinInput.toUpperCase()); setIsCustomSymbol(true); setCoinInput(""); return; }
    try {
        const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${coinInput}`);
        const searchData = await searchRes.json();
        if (searchData.coins && searchData.coins.length > 0) { setSelectedCoin(searchData.coins[0].id); setIsCustomSymbol(false); setCoinInput(""); } 
        else { setCoinSymbol(coinInput.toUpperCase()); setIsCustomSymbol(true); setCoinInput(""); showStatus(`ไม่พบใน CoinGecko - ค้นหาบน TradingView`, "info"); }
    } catch (err) { setCoinSymbol(coinInput.toUpperCase()); setIsCustomSymbol(true); setCoinInput(""); }
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
    return <div id={containerId} ref={containerRef} className="w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 relative" />;
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
        const apiKey = ""; // 👈 API Key will be injected by the environment
        
        const systemPrompt = `You are BoomBot AI, an intelligent crypto assistant.
        Current Market Context: Active Coin: ${coinSymbol}, Price: $${currentPrice.toLocaleString()}, 24h Change: ${priceChange.toFixed(2)}%, Market Cap: $${marketStats.marketCap.toLocaleString()}, Fear & Greed: ${fearGreed.value} (${fearGreed.status}).
        Role: Crypto assistant. Tone: Friendly, professional. Language: Thai.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: currentQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        const data = await response.json();
        const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "ขออภัย ผมไม่สามารถประมวลผลคำตอบได้";
        setAiMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponse }]);

    } catch (error) {
        console.error("AI Error:", error);
        setAiMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: `เกิดข้อผิดพลาด: ${error.message}` }]);
    } finally {
        setIsAiTyping(false);
    }
  };
  
  useEffect(() => { if (isAiChatOpen) aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages, isAiTyping, isAiChatOpen]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return showStatus("รูปภาพต้องมีขนาดไม่เกิน 1MB", "error");
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!chatInput.trim() && !selectedImage) || !db) return;
    const senderName = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : `Guest-${Math.floor(Math.random()*1000)}`;
    const avatar = account ? `https://api.dicebear.com/7.x/identicon/svg?seed=${account}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'community_chat'), {
            text: chatInput, image: selectedImage, sender: senderName, isWallet: !!account, avatar: avatar, timestamp: Date.now()
        });
        setChatInput(""); setSelectedImage(null); 
    } catch (error) { showStatus("ส่งข้อความไม่สำเร็จ", "error"); }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); showStatus("คัดลอกแล้ว", "success"); };
  const formatNumber = (num) => { if (!num) return "-"; if (num >= 1e9) return (num / 1e9).toFixed(2) + "B"; if (num >= 1e6) return (num / 1e6).toFixed(2) + "M"; return num.toLocaleString(); };

  return (
    <div className={`min-h-screen ${bodyFont} bg-[#020617] text-slate-200 p-4 md:p-8 relative`}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 15% 50%, rgba(6, 182, 212, 0.12) 0%, transparent 25%), radial-gradient(circle at 85% 30%, rgba(99, 102, 241, 0.12) 0%, transparent 25%)' }}></div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        
        <button onClick={() => setIsAiChatOpen(!isAiChatOpen)} className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-2xl shadow-indigo-600/40 transition-all hover:scale-110 active:scale-95 group"><Bot className="w-8 h-8" /><span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span></button>

        {isAiChatOpen && (
            <div className={`fixed bottom-24 right-6 w-[350px] md:w-96 h-[500px] ${glassPanel} rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300`}>
                <div className="bg-indigo-600 p-4 flex justify-between items-center border-b border-indigo-500"><div className="flex items-center gap-3"><div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm"><Sparkles className="w-5 h-5 text-white"/></div><div><h3 className={`font-bold text-white text-sm ${headingFont}`}>AI Crypto Guru</h3><div className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span><p className="text-[10px] text-indigo-100 font-medium">Online & Ready</p></div></div></div><button onClick={() => setIsAiChatOpen(false)} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5"/></button></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/80 custom-scrollbar">{aiMessages.map((msg) => (<div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.sender === 'bot' ? 'bg-indigo-600' : 'bg-slate-700'}`}>{msg.sender === 'bot' ? <Bot className="w-5 h-5 text-white" /> : <Users className="w-4 h-4 text-slate-300" />}</div><div className={`max-w-[85%] rounded-2xl p-3 shadow-md text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-indigo-900/40 border border-indigo-500/20 text-indigo-100 rounded-tl-none'}`}>{msg.text}</div></div>))}{isAiTyping && (<div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0"><Bot className="w-5 h-5 text-white" /></div><div className="bg-indigo-900/40 border border-indigo-500/20 px-4 py-3 rounded-2xl rounded-tl-none"><div className="flex gap-1"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div></div></div></div>)}<div ref={aiChatEndRef} /></div>
                <form onSubmit={handleAiSendMessage} className="p-3 bg-slate-900/90 border-t border-slate-800 flex gap-2 items-center"><input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="ถามราคาเหรียญ..." className={`flex-1 ${glassInput} rounded-full px-4 py-2.5 text-sm`}/><button type="submit" disabled={!aiInput.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-full transition-all flex items-center justify-center shadow-lg shadow-indigo-900/20 hover:scale-105 active:scale-95"><Zap className="w-4 h-4 fill-current" /></button></form>
            </div>
        )}

        {/* Header */}
        <div className={`flex flex-col md:flex-row justify-between items-center p-6 rounded-2xl ${glassPanel}`}>
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative w-14 h-14 bg-slate-900 rounded-xl border border-slate-700/50 flex items-center justify-center shadow-2xl overflow-hidden group-hover:border-cyan-500/50 transition-colors">
                 <svg viewBox="0 0 64 64" className="w-9 h-9 transform group-hover:scale-110 transition-transform duration-300" fill="none"><path d="M8 12 h 48 v 12 h -48 z" fill="url(#logo-grad)" opacity="0.7"/><path d="M4 18 h 56 c 2.2 0 4 1.8 4 4 v 32 c 0 2.2 -1.8 4 -4 4 h -56 c -2.2 0 -4 -1.8 -4 -4 v -32 c 0 -2.2 1.8 -4 4 -4 z" fill="url(#logo-grad)" /><path d="M4 26 h 56" stroke="#0f172a" strokeWidth="2" opacity="0.3" /><path d="M46 32 h 14 v 12 h -14 c -3.3 0 -6 -2.7 -6 -6 s 2.7 -6 6 -6 z" fill="#0f172a" /><circle cx="52" cy="38" r="3" fill="url(#logo-grad)" /><defs><linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#06b6d4" /><stop offset="50%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs></svg>
              </div>
            </div>
            <div><h1 className={`text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent ${headingFont}`}>BoomTech Gateway</h1><p className="text-slate-400 text-sm flex items-center gap-1">Universal Protocol <span className="text-xs bg-blue-900/50 px-2 py-0.5 rounded text-blue-400 border border-blue-800">BETA</span></p></div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            {account && <div className="hidden md:flex flex-col items-end"><span className={`text-sm font-bold text-white tracking-wide ${headingFont}`}>{balance} ETH</span><span className="text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">Available <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div></span></div>}
            {/* ✅ Show Admin Badge */}
            {isOwner && <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg border border-yellow-500/20 text-xs font-bold flex items-center gap-1"><Shield className="w-3 h-3" /> ADMIN</div>}
            
            {/* ✅ ปรับ UI ปุ่มเชื่อมต่อให้แสดงทั้ง MetaMask และ Binance (สีส้ม-เหลือง) */}
            <button onClick={connectWallet} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${account ? "bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:bg-slate-700" : "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-orange-500/20 active:scale-95"}`}>
                {account ? (
                    <><Wallet className="w-4 h-4" />{account.slice(0,6)}...{account.slice(-4)}</>
                ) : (
                    // ใช้ไอคอน Fox (จำลองด้วย SVG) หรือข้อความที่ชัดเจน
                    <><LogOut className="w-4 h-4 rotate-180" /> Connect MetaMask / Binance</>
                )}
            </button>
          </div>
        </div>

        {/* Contract Setup - Hidden for Non-Admin */}
        {isOwner && (
            <div className={`p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center ${glassPanel}`}>
              <div className="flex-1 w-full"><label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider">Smart Contract Address</label><input type="text" placeholder="0x..." value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} className={`w-full rounded-lg px-4 py-2 font-mono text-sm ${glassInput}`}/></div>
            </div>
        )}

        {/* Main Interface */}
        <div className={`rounded-2xl overflow-hidden relative ${glassPanel}`}>
          {activeTab === 'shop' && cart.length > 0 && (
            <button onClick={() => setIsCartOpen(!isCartOpen)} className="absolute top-4 right-4 z-20 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg shadow-blue-600/30 transition-all active:scale-95"><div className="relative"><ShoppingCart className="w-6 h-6" /><span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-slate-900 font-bold">{cart.reduce((a,b) => a+b.qty, 0)}</span></div></button>
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-hide">
            {[
                { id: 'wallet', icon: Wallet, label: 'กระเป๋าเงิน' }, 
                { id: 'market', icon: BarChart2, label: 'ตลาด' }, 
                { id: 'game', icon: Gamepad2, label: 'BoomPet' }, // ✅ เปลี่ยนชื่อแท็บ
                { id: 'shop', icon: ShoppingBag, label: 'ร้านค้า' }, 
                { id: 'news', icon: Newspaper, label: 'ข่าวสาร' }, 
                { id: 'community', icon: MessageSquare, label: 'ชุมชน' }, 
                { id: 'donate', icon: Heart, label: 'บริจาค' }, 
                { id: 'admin', icon: Settings, label: 'บอดี้การ์ด (Admin)' }
            ].map(tab => {
               if (tab.id === 'admin' && !isOwner) return null;
               return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 min-w-[100px] py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${activeTab === tab.id ? 'text-white bg-slate-800/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}><tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-400' : ''}`} /> {tab.label}{activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.5)]"></div>}</button>);
            })}
          </div>

          <div className="p-6 md:p-8">
            {/* Wallet Tab */}
            {activeTab === 'wallet' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-center mb-6"><div className={`p-1 rounded-xl flex ${glassPanel}`}><button onClick={() => setWalletMode('transfer')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${walletMode === 'transfer' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}><Send className="w-4 h-4" /> โอนเงิน (Send)</button><button onClick={() => setWalletMode('deposit')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${walletMode === 'deposit' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}><QrCode className="w-4 h-4" /> รับเงิน (Receive)</button></div></div>
                    
                    {/* Send Mode */}
                    {walletMode === 'transfer' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className={`flex p-1 rounded-xl w-fit ${glassPanel}`}><button onClick={() => setTransferType('ETH')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${transferType === 'ETH' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Native ETH</button><button onClick={() => setTransferType('ERC20')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${transferType === 'ERC20' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>ERC-20 Token</button></div>
                                {transferType === 'ERC20' && (<div><label className="block text-sm text-slate-400 mb-1 ml-1">Token Contract Address</label><input type="text" placeholder="0x..." value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-sm ${glassInput}`} /><p className="text-xs text-emerald-400 mt-1 text-right">Balance: {tokenBalance}</p></div>)}
                                <div><label className="block text-sm text-slate-400 mb-1 ml-1">ผู้รับ (Recipient)</label><input type="text" placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-sm ${glassInput}`} /></div>
                                <div><label className="block text-sm text-slate-400 mb-1 ml-1">จำนวน (Amount)</label><div className="relative"><input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-sm ${glassInput}`} /><span className="absolute right-4 top-3.5 text-slate-500 text-sm font-bold">{transferType === 'ETH' ? 'ETH' : 'TOKENS'}</span></div></div>
                                {/* ❌ ลบช่อง Affiliate UI ออก เพราะบังคับเข้า Admin แล้ว */}
                                <button onClick={handleTransfer} disabled={isLoading || !recipient || !amount} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">{isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-5 h-5" />}{transferType === 'ERC20' ? 'Approve & Transfer' : 'ยืนยันการโอน (Transfer)'}</button>
                            </div>
                            {/* Transaction History Column */}
                            <div className={`rounded-xl p-4 flex flex-col h-full max-h-[500px] ${glassPanel}`}>
                                <h3 className={`text-white font-bold mb-4 flex items-center gap-2 ${headingFont}`}><History className="w-5 h-5 text-slate-400"/> ประวัติธุรกรรมล่าสุด</h3>
                                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                    {transactions.length === 0 ? <p className="text-slate-500 text-center py-10">ยังไม่มีรายการ</p> : transactions.map(tx => (
                                        <div key={tx.id} className="bg-slate-950/50 p-3 rounded-lg border border-slate-700/50 text-sm">
                                            <div className="flex justify-between mb-1"><span className={`font-bold ${tx.type.includes('BUY') ? 'text-pink-400' : 'text-emerald-400'}`}>{tx.type}</span><span className="text-slate-500 text-xs">{new Date(tx.timestamp).toLocaleTimeString()}</span></div>
                                            <div className="text-white font-mono">{tx.amount} {tx.token}</div>
                                            <div className="text-xs text-slate-500 truncate">To: {tx.to}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {walletMode === 'deposit' && (<div className="flex flex-col items-center justify-center py-6 space-y-8">{account ? (<div className="bg-white p-4 rounded-3xl shadow-xl shadow-white/5"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${account}`} alt="Wallet QR" className="w-64 h-64 rounded-xl" /></div>) : (<div className="w-64 h-64 bg-slate-800/50 rounded-3xl flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700"><p>กรุณาเชื่อมต่อกระเป๋า</p></div>)}<div className="w-full max-w-md bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col gap-3"><span className="text-sm text-slate-400 font-medium">Wallet Address ของคุณ</span><div className="flex items-center gap-3"><code className="flex-1 font-mono text-emerald-400 break-all bg-emerald-900/10 p-3 rounded-lg border border-emerald-500/20 text-sm">{account || "ยังไม่เชื่อมต่อ"}</code><button onClick={() => account && copyToClipboard(account)} className={`p-3 rounded-lg ${glassButton}`}><Copy className="w-5 h-5" /></button></div></div></div>)}
                </div>
            )}

            {/* ✅ Market Tab (Enhanced with Refresh Button) */}
            {activeTab === 'market' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <form onSubmit={handleSearchCoin} className="relative flex-1">
                    <input type="text" placeholder="พิมพ์ชื่อเหรียญ (เช่น BTC, Ethereum) หรือ Symbol (NASDAQ:AAPL)..." value={coinInput} onChange={(e) => setCoinInput(e.target.value)} className={`w-full rounded-xl pl-12 pr-4 py-3 ${glassInput}`} />
                    <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                    <button type="submit" className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition-colors">{isLoading ? "..." : "ค้นหา"}</button>
                  </form>
                  {/* ✅ Market Refresh Button */}
                  <div className="flex gap-2">
                      <button onClick={fetchPriceData} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${glassButton}`}>
                          <RefreshCw className={`w-4 h-4 ${isMarketLoading ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">รีเฟรช</span>
                      </button>
                      <div className={`flex p-1 rounded-xl overflow-x-auto scrollbar-hide ${glassPanel}`}>{quickCoins.map((coin) => (<button key={coin.symbol} onClick={() => { setCoinSymbol(coin.symbol); if (coin.custom) { setIsCustomSymbol(true); setCoinSymbol(coin.custom.split(':')[1]); } else { setSelectedCoin(coin.id); setIsCustomSymbol(false); }}} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${coinSymbol === coin.symbol ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>{coin.symbol}</button>))}</div>
                  </div>
                </div>

                {!isCustomSymbol && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-800 pb-6">
                        <div className="flex justify-between items-end md:block">
                            <div>
                                <h2 className={`text-2xl font-bold text-white flex items-center gap-3 capitalize ${headingFont}`}>{coinImage ? <img src={coinImage} className="w-8 h-8 rounded-full" alt={selectedCoin} /> : <Coins className="w-8 h-8 text-blue-500" />}{selectedCoin} <span className="text-sm text-slate-500 font-normal uppercase">({coinSymbol})</span></h2>
                                <div className={`text-4xl font-bold text-white tracking-tight mt-2 ${headingFont}`}>${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</div>
                                <div className={`text-sm font-medium flex items-center gap-1 mt-1 ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{priceChange >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingUp className="w-4 h-4 rotate-180"/>}{priceChange.toFixed(2)}% (24h)</div>
                            </div>
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
                
                {/* ✅ Binance Affiliate Banner */}
                <div className="w-full p-0.5 rounded-2xl bg-gradient-to-r from-[#F0B90B] to-[#F8D33A] shadow-lg shadow-yellow-500/10 mb-2 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="absolute inset-0 bg-[url('https://public.bnbstatic.com/image/cms/blog/20200707/62295604-0010-4b2e-8a03-911145625345.png')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
                    <div className="bg-slate-950/95 backdrop-blur-md rounded-[14px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="bg-[#F0B90B] p-2.5 rounded-xl text-slate-900 shrink-0 shadow-lg shadow-yellow-500/20">
                                <svg viewBox="0 0 32 32" className="w-8 h-8 fill-current"><path d="M16 0l6 6-6 6-6-6 6-6zM6 6l6 6-6 6-6-6 6-6zM26 6l6 6-6 6-6-6 6-6zM16 12l6 6-6 6-6-6 6-6zM6 18l6 6-6 6-6-6 6-6zM26 18l6 6-6 6-6-6 6-6zM16 24l6 6-6 6-6-6 6-6z"/></svg>
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className={`text-lg font-bold text-white ${headingFont} flex items-center justify-center md:justify-start gap-2`}>
                                    เทรดคริปโตอันดับ 1 กับ <span className="text-[#F0B90B]">Binance</span>
                                </h3>
                                <p className="text-sm text-slate-400">ค่าธรรมเนียมต่ำ ปลอดภัย รองรับภาษาไทย สมัครผ่านลิงก์นี้รับส่วนลดค่าธรรมเนียม!</p>
                            </div>
                        </div>
                        <a 
                            href="https://www.binance.com/en/register?ref=GRO_28502_6PQ0U"
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-[#F0B90B] hover:bg-[#D9A507] text-slate-900 font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-yellow-500/20 flex items-center gap-2 whitespace-nowrap group-hover:scale-105"
                        >
                            สมัครเลย <ExternalLink className="w-4 h-4"/>
                        </a>
                    </div>
                </div>

                {/* Robust TradingView Chart Container */}
                <div className="w-full">
                    <TradingViewWidget symbol={coinSymbol} isCustom={isCustomSymbol} />
                </div>
              </div>
            )}

            {/* ✅ Game Tab Content (BoomPet) */}
            {activeTab === 'game' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px] flex flex-col items-center justify-center">
                    <div className="w-full max-w-2xl mx-auto space-y-6 text-center">
                        {/* Header & Stats */}
                        <div className="space-y-2">
                            <h2 className={`text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 ${headingFont}`}>BOOM PET</h2>
                            <p className="text-slate-400 text-sm">เลี้ยงมอนสเตอร์ดิจิทัล • ดูแลให้เติบโต (Free to Play)</p>
                        </div>

                        <div className={`p-6 rounded-3xl ${glassPanel} border-2 border-slate-700 flex flex-col md:flex-row gap-8 items-start justify-center`}>
                            
                            {/* Controls / Info */}
                            <div className="w-full md:w-1/3 space-y-4 text-left order-2 md:order-1">
                                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Score</p>
                                    <div className="flex items-center gap-2 text-2xl font-bold text-white font-mono">
                                        <Trophy className="w-6 h-6 text-yellow-400" />
                                        {gameScore.toLocaleString()} BP
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Hunger</span>
                                        <span>{pet.hunger}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-2">
                                        <div className="bg-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pet.hunger}%` }}></div>
                                    </div>

                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Happiness</span>
                                        <span>{pet.happiness}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-2">
                                        <div className="bg-pink-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pet.happiness}%` }}></div>
                                    </div>

                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Energy</span>
                                        <span>{pet.energy}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pet.energy}%` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button 
                                        onClick={() => handleAction('feed')}
                                        className="py-3 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-600/50 hover:bg-orange-600/40 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                                    >
                                        <Utensils className="w-5 h-5"/> Feed
                                    </button>
                                    <button 
                                        onClick={() => handleAction('train')}
                                        className="py-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-600/50 hover:bg-blue-600/40 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                                    >
                                        <Activity className="w-5 h-5"/> Train
                                    </button>
                                    <button 
                                        onClick={() => handleAction(pet.isSleeping ? 'wake' : 'sleep')}
                                        className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 col-span-2 ${pet.isSleeping ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50' : 'bg-purple-600/20 text-purple-400 border-purple-600/50 hover:bg-purple-600/40'}`}
                                    >
                                        {pet.isSleeping ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>} 
                                        {pet.isSleeping ? "Wake Up" : "Sleep"}
                                    </button>
                                </div>
                            </div>

                            {/* Pet Display */}
                            <div className="order-1 md:order-2 bg-slate-900 p-8 rounded-xl shadow-2xl border-4 border-slate-800 flex-1 w-full flex flex-col items-center justify-center relative min-h-[300px]">
                                {pet.isSleeping && (
                                    <div className="absolute top-4 right-4 text-4xl animate-pulse">zZZ</div>
                                )}
                                
                                {(() => {
                                    const CurrentStage = PET_STAGES[pet.stage];
                                    const Icon = CurrentStage.icon;
                                    return (
                                        <div className={`relative ${pet.isSleeping ? 'opacity-50 grayscale' : ''}`}>
                                            <div className={`absolute inset-0 blur-3xl opacity-20 ${CurrentStage.color.replace('text-', 'bg-')}`}></div>
                                            {pet.stage === 'egg' ? (
                                                <button onClick={() => handleAction('hatch')} className="animate-bounce">
                                                    <Icon className={`w-32 h-32 ${CurrentStage.color} drop-shadow-2xl`} />
                                                    <p className="text-center text-xs mt-2 text-slate-400">Click to Hatch!</p>
                                                </button>
                                            ) : (
                                                <div className="animate-pulse">
                                                    <Icon className={`w-32 h-32 ${CurrentStage.color} drop-shadow-2xl`} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                <div className="mt-8 text-center">
                                    <h3 className="text-2xl font-bold text-white">{PET_STAGES[pet.stage].name}</h3>
                                    <p className="text-slate-400 text-sm capitalize">Stage: {pet.stage}</p>
                                    
                                    {PET_STAGES[pet.stage].next && (
                                        <div className="mt-4 w-full max-w-[200px]">
                                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                                <span>EXP</span>
                                                <span>{pet.exp} / {PET_STAGES[pet.stage].reqExp}</span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                                                <div 
                                                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                                                    style={{ width: `${Math.min(100, (pet.exp / PET_STAGES[pet.stage].reqExp) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                        
                        {gameScore < 100 && (
                            <button onClick={handleFaucet} className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors flex items-center justify-center gap-1 mx-auto">
                                <Gift className="w-3 h-3"/> ขอรับแต้มฟรี (Faucet)
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Shop Tab */}
            {activeTab === 'shop' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-[500px]">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div><h2 className={`text-2xl font-bold text-white flex items-center gap-2 ${headingFont}`}><ShoppingBag className="w-6 h-6 text-blue-400" /> BoomShop</h2><p className="text-slate-400 text-sm">สินค้าคุณภาพสำหรับชาว Crypto & Tech</p></div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">{["All", "Merch", "Gadget", "Mining", "Digital", "NFT"].map(cat => (<button key={cat} onClick={() => setShopCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${shopCategory === cat ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}>{cat}</button>))}</div>
                    </div>

                    {/* ✅ Seller Dashboard Toggle Button (Only for Owner) */}
                    {isOwner && (
                        <div className="flex justify-end mb-4">
                            <button 
                                onClick={() => setIsSellerMode(!isSellerMode)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${isSellerMode ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-yellow-500 border border-yellow-500/50'}`}
                            >
                                {isSellerMode ? <X className="w-4 h-4"/> : <Settings className="w-4 h-4"/>}
                                {isSellerMode ? "ปิดโหมดผู้ขาย" : "จัดการร้านค้า (Seller Mode)"}
                            </button>
                        </div>
                    )}

                    {/* ✅ Seller Dashboard Content */}
                    {isOwner && isSellerMode ? (
                        <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                            
                            {/* 1. Dashboard Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-xl ${glassPanel} flex items-center justify-between`}>
                                    <div><p className="text-slate-400 text-xs uppercase">Total Products</p><h3 className={`text-2xl font-bold text-white ${headingFont}`}>{products.length}</h3></div>
                                    <div className="p-3 bg-blue-500/20 rounded-lg"><Box className="w-6 h-6 text-blue-400"/></div>
                                </div>
                                <div className={`p-4 rounded-xl ${glassPanel} flex items-center justify-between`}>
                                    <div><p className="text-slate-400 text-xs uppercase">Total Orders</p><h3 className={`text-2xl font-bold text-white ${headingFont}`}>{shopOrders.length}</h3></div>
                                    <div className="p-3 bg-emerald-500/20 rounded-lg"><ShoppingBag className="w-6 h-6 text-emerald-400"/></div>
                                </div>
                            </div>

                            {/* 2. Add/Edit Product Form */}
                            <div className={`p-6 rounded-2xl ${glassPanel}`}>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    {editingProductId ? <Edit2 className="w-5 h-5 text-yellow-400"/> : <Plus className="w-5 h-5 text-emerald-400"/>} 
                                    {editingProductId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" placeholder="ชื่อสินค้า" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className={`rounded-lg px-4 py-2 text-sm ${glassInput}`}/>
                                    <input type="number" placeholder="ราคา (ETH)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className={`rounded-lg px-4 py-2 text-sm ${glassInput}`}/>
                                    <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className={`rounded-lg px-4 py-2 text-sm ${glassInput}`}>
                                        {["Merch", "Gadget", "Mining", "Digital", "NFT"].map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                                    </select>
                                    <input type="text" placeholder="URL รูปภาพ (Optional)" value={newProduct.image} onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} className={`rounded-lg px-4 py-2 text-sm ${glassInput}`}/>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    {editingProductId && (
                                        <button onClick={cancelEdit} className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-bold transition-colors">ยกเลิก</button>
                                    )}
                                    <button onClick={handleSaveProduct} className={`flex-1 text-white py-2 rounded-lg font-bold transition-colors ${editingProductId ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                                        {editingProductId ? <><Save className="w-4 h-4 inline mr-2"/> บันทึกการแก้ไข</> : <><Plus className="w-4 h-4 inline mr-2"/> เพิ่มสินค้า</>}
                                    </button>
                                </div>
                            </div>

                            {/* 3. Manage Inventory (List of Products with Edit/Delete) */}
                            <div className={`p-6 rounded-2xl ${glassPanel}`}>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-yellow-400"/> จัดการสินค้าในคลัง</h3>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                    {products.map(p => (
                                        <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg border ${editingProductId === p.id ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-slate-950/50 border-slate-700/50'}`}>
                                            <div className="flex items-center gap-3">
                                                <img src={p.image} className="w-10 h-10 rounded-md object-cover" alt=""/>
                                                <div>
                                                    <p className="font-bold text-sm text-white">{p.name}</p>
                                                    <p className="text-xs text-slate-400">{p.category} • {p.price} ETH</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => startEditProduct(p)} className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                                                <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 4. Recent Orders List */}
                            <div className={`p-6 rounded-2xl ${glassPanel}`}>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-blue-400"/> รายการสั่งซื้อล่าสุด</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                                    {/* Mock Order for Demo if empty */}
                                    {shopOrders.length === 0 && (
                                        <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/50 flex justify-between items-center opacity-60">
                                            <div>
                                                <div className="text-white font-bold text-sm">ตัวอย่าง: BoomTech Hoodie (x1)</div>
                                                <div className="text-xs text-slate-500">Buyer: 0x123...abc (Mock)</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-emerald-400 font-bold">0.035 ETH</div>
                                                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded">Pending</span>
                                            </div>
                                        </div>
                                    )}
                                    {shopOrders.map(order => (
                                        <div key={order.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="text-white font-bold text-sm">{order.details || "Unknown Items"}</div>
                                                    <div className="text-xs text-slate-500">Buyer: {order.from}</div>
                                                    <div className="text-xs text-slate-500">{new Date(order.timestamp).toLocaleString()}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-emerald-400 font-bold">{order.amount} {order.token}</div>
                                                    <span className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-800">Paid</span>
                                                </div>
                                            </div>
                                            {/* ✅ แสดงที่อยู่จัดส่งเฉพาะในหน้า Admin */}
                                            {order.shippingAddress && (
                                                <div className="mt-2 bg-slate-900 p-2 rounded border border-slate-700">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> Shipping Address</p>
                                                    <p className="text-xs text-slate-300 whitespace-pre-wrap">{order.shippingAddress}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Standard Shop Grid */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.filter(p => shopCategory === 'All' || p.category === shopCategory).map(product => (
                                <div key={product.id} className={`rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all group flex flex-col relative ${glassPanel}`}>
                                    {isOwner && (
                                        <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setIsSellerMode(true); startEditProduct(product); }} className="bg-yellow-500/80 hover:bg-yellow-600 text-white p-1.5 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                                            <button onClick={() => deleteProduct(product.id)} className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    )}
                                    <div className="h-48 overflow-hidden relative"><img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /><div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs text-white border border-white/10">{product.category}</div></div>
                                    <div className="p-4 flex-1 flex flex-col"><h3 className={`font-bold text-white text-lg mb-1 ${headingFont}`}>{product.name}</h3><div className="mt-auto flex items-center justify-between pt-4"><div className="text-emerald-400 font-bold font-mono">{product.price} ETH</div><button onClick={() => addToCart(product)} className={`p-2 rounded-lg ${glassButton}`}><Plus className="w-5 h-5" /></button></div></div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Cart Modal */}
                    {isCartOpen && (
                        <div className="absolute top-0 right-0 w-full md:w-80 h-full bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl z-30 p-6 flex flex-col animate-in slide-in-from-right duration-300 rounded-l-2xl">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800"><h3 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> ตะกร้าสินค้า</h3><button onClick={() => setIsCartOpen(false)}><X className="w-6 h-6 text-slate-400 hover:text-white" /></button></div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                                {cart.length === 0 ? (<div className="text-center text-slate-500 py-10"><Package className="w-12 h-12 mx-auto mb-2 opacity-20" /><p>ตะกร้าว่างเปล่า</p></div>) : (cart.map(item => (
                                    <div key={item.id} className="flex gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800"><img src={item.image} className="w-16 h-16 rounded-lg object-cover" alt="" /><div className="flex-1"><h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4><p className="text-xs text-emerald-400 mb-2">{item.price} ETH</p><div className="flex items-center gap-2"><button onClick={() => updateQty(item.id, -1)} className="p-1 bg-slate-800 rounded text-slate-400 hover:text-white"><Minus className="w-3 h-3" /></button><span className="text-xs font-mono w-4 text-center">{item.qty}</span><button onClick={() => updateQty(item.id, 1)} className="p-1 bg-slate-800 rounded text-slate-400 hover:text-white"><Plus className="w-3 h-3" /></button><button onClick={() => removeFromCart(item.id)} className="ml-auto p-1 text-red-400 hover:bg-red-900/20 rounded"><Trash2 className="w-3 h-3" /></button></div></div></div>
                                )))}
                            </div>
                            {/* Buyer Order History Section in Cart (Mini) */}
                            <div className="mt-4 border-t border-slate-800 pt-4">
                                <h4 className="text-xs text-slate-400 mb-2 uppercase font-bold flex items-center gap-1"><History className="w-3 h-3"/> ประวัติการซื้อของคุณ</h4>
                                <div className="max-h-32 overflow-y-auto space-y-2 text-xs">
                                    {transactions.filter(t => t.type.includes('SHOP_BUY') && t.from === account).length === 0 ? (<p className="text-slate-600">ไม่มีประวัติการซื้อ</p>) : (transactions.filter(t => t.type.includes('SHOP_BUY') && t.from === account).slice(0,3).map(t => (<div key={t.id} className="flex justify-between text-slate-300"><span className="truncate w-24">{t.details || "Order"}</span><span className="text-emerald-500">{t.amount} {t.token}</span></div>)))}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                                
                                {/* ✅ ส่วนกรอกที่อยู่จัดส่ง */}
                                <div>
                                    <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">ที่อยู่จัดส่ง (Shipping Address) <span className="text-red-400">*</span></label>
                                    <textarea 
                                        placeholder="ชื่อ-นามสกุล, เบอร์โทรศัพท์, บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์" 
                                        value={shippingAddress} 
                                        onChange={(e) => setShippingAddress(e.target.value)} 
                                        className={`w-full rounded-lg px-3 py-2 text-sm h-24 resize-none ${glassInput}`}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Payment Method</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => setPaymentMethod('ETH')} className={`py-2 text-xs font-bold rounded-lg border ${paymentMethod === 'ETH' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 text-slate-400'}`}>ETH</button>
                                        <button onClick={() => setPaymentMethod('USDT')} className={`py-2 text-xs font-bold rounded-lg border ${paymentMethod === 'USDT' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-700 text-slate-400'}`}>USDT</button>
                                        <button onClick={() => setPaymentMethod('PROMPTPAY')} className={`py-2 text-xs font-bold rounded-lg border ${paymentMethod === 'PROMPTPAY' ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-700 text-slate-400'}`}>QR</button>
                                    </div>
                                </div>
                                {paymentMethod === 'USDT' && (<div><input type="text" placeholder="USDT Token Address" value={usdtAddress} onChange={(e) => setUsdtAddress(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm ${glassInput}`}/><p className="text-xs text-right mt-1 text-emerald-400">Bal: {tokenBalance}</p></div>)}
                                {paymentMethod === 'PROMPTPAY' && cart.length > 0 && (<div className="bg-white p-3 rounded-xl flex flex-col items-center"><img src={`https://promptpay.io/${PROMPTPAY_ID}/${cartTotalTHB}.png`} alt="PromptPay" className="w-32 h-32" /><div className="text-slate-900 font-bold text-lg mt-2">{cartTotalTHB.toLocaleString()} THB</div><div className="text-xs text-slate-500">Scan to Pay</div></div>)}
                                <div className="flex justify-between items-center text-sm"><span className="text-slate-400">Total (Est.)</span><span className="text-xl font-bold text-white font-mono">{paymentMethod === 'PROMPTPAY' ? `${cartTotalTHB.toLocaleString()} THB` : `${cartTotalETH.toFixed(4)} ETH`}</span></div>
                                <button onClick={handleCheckout} disabled={cart.length === 0 || isLoading || !shippingAddress.trim()} className={`w-full text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 ${paymentMethod === 'PROMPTPAY' ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'} disabled:opacity-50`}>{isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (paymentMethod === 'PROMPTPAY' ? "Confirm Payment" : "Pay with Crypto")}</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ✅ News Tab (Updated with Refresh Button) */}
            {activeTab === 'news' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-2">
                  <h2 className={`text-xl font-bold text-white flex items-center gap-2 ${headingFont}`}><Newspaper className="w-6 h-6 text-blue-400" /> ข่าวสารคริปโต (Cointelegraph)</h2>
                  <div className="flex items-center gap-2"><div className="text-xs text-slate-500 hidden sm:block">Live Updates</div><button onClick={fetchNews} className={`p-2 rounded-lg group ${glassButton}`} title="รีเฟรชข่าวสาร"><RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${isNewsLoading ? 'animate-spin text-blue-400' : ''}`}/></button></div>
                </div>
                {isNewsLoading ? (<div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-slate-500" /></div>) : newsData.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{newsData.map((item) => (<a href={item.url} target="_blank" rel="noreferrer" key={item.id} className={`block rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group h-full flex flex-col ${glassPanel}`}><div className="h-48 overflow-hidden relative bg-slate-950"><img src={item.imageurl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { if (e.target.src !== "https://images.unsplash.com/photo-1621504450168-38f684489e05?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80") { e.target.src = "https://images.unsplash.com/photo-1621504450168-38f684489e05?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"; } }} /><div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full border border-white/10 flex items-center gap-1"><img src={item.source_info.img} className="w-3 h-3 rounded-full" alt="" onError={(e)=>e.target.style.display='none'}/>{item.source_info.name}</div></div><div className="p-5 flex-1 flex flex-col"><h3 className={`text-white font-bold text-lg leading-tight mb-3 group-hover:text-blue-400 transition-colors line-clamp-2 ${headingFont}`}>{item.title}</h3><p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1">{item.body}</p><div className="flex items-center justify-between mt-auto text-xs text-slate-500 border-t border-slate-800 pt-3"><div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.published_on * 1000).toLocaleDateString()}</div><span className="flex items-center gap-1 group-hover:text-blue-400 transition-colors">อ่านต่อ <ExternalLink className="w-3 h-3" /></span></div></div></a>))}</div>) : (<div className="text-center py-20 text-slate-500">ไม่พบข้อมูลข่าวสาร</div>)}
              </div>
            )}
            
            {/* Community Tab */}
            {activeTab === 'community' && (
              <div className="flex flex-col h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-4"><div className="bg-blue-900/30 p-2 rounded-lg"><MessageSquare className="w-6 h-6 text-blue-400"/></div><div><h2 className={`text-xl font-bold text-white ${headingFont}`}>Community Chat</h2><p className="text-xs text-slate-400">พื้นที่พูดคุยแลกเปลี่ยนสำหรับชาว BoomTech</p></div></div>
                  {dbError && (<div className="mb-4 bg-red-900/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-3 text-red-200 text-xs"><AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" /><span>{dbError}</span></div>)}
                  <div className={`flex-1 rounded-xl overflow-hidden flex flex-col shadow-inner relative ${glassPanel}`}>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                          {chatMessages.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2"><MessageSquare className="w-12 h-12 opacity-20"/><p>ยังไม่มีข้อความ เริ่มต้นทักทายเพื่อนๆ ได้เลย!</p></div>) : (chatMessages.map((msg) => (<div key={msg.id} className={`flex items-start gap-3 ${msg.sender === (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '') ? 'flex-row-reverse' : ''}`}><img src={msg.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0" /><div className={`max-w-[80%] rounded-2xl p-3 ${msg.sender === (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '') ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}><div className="flex items-center gap-2 mb-1"><span className={`text-[10px] font-bold ${msg.sender === (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '') ? 'text-blue-200' : 'text-slate-400'}`}>{msg.sender}</span>{msg.isWallet && <Shield className="w-3 h-3 text-emerald-400" />}<span className="text-[9px] opacity-60 ml-auto">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>{msg.image && (<div className="mb-2 rounded-lg overflow-hidden border border-black/20"><img src={msg.image} alt="attached" className="max-w-full h-auto object-cover max-h-60" /></div>)}{msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>}</div></div>)))}
                          <div ref={chatEndRef} />
                      </div>
                      {selectedImage && (<div className="absolute bottom-[70px] left-4 right-4 bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg border border-slate-600 flex items-center justify-between shadow-lg z-10 animate-in fade-in slide-in-from-bottom-2"><div className="flex items-center gap-3 overflow-hidden"><img src={selectedImage} alt="Preview" className="h-12 w-12 object-cover rounded-md border border-slate-500" /><span className="text-xs text-slate-300 truncate">พร้อมส่งรูปภาพ...</span></div><button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button></div>)}
                      <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 items-center"><input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden"/><button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-full ${glassButton}`} title="แนบรูปภาพ"><ImageIcon className="w-5 h-5" /></button><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={account ? "พิมพ์ข้อความ..." : "เชื่อมต่อกระเป๋าเพื่อแชท"} disabled={!account && !isLoading} className={`flex-1 rounded-full px-4 py-2 text-sm ${glassInput}`}/><button type="submit" disabled={(!chatInput.trim() && !selectedImage) || !account} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10 shadow-lg"><Send className="w-4 h-4 ml-0.5" /></button></form>
                  </div>
              </div>
            )}
            {activeTab === 'donate' && (
              <div className="space-y-8 text-center py-10 animate-in fade-in zoom-in duration-300"><div className="w-24 h-24 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-500/20 shadow-lg shadow-pink-500/10"><Heart className="w-12 h-12 text-pink-500" /></div><div><h2 className={`text-2xl font-bold text-white mb-2 ${headingFont}`}>สนับสนุนโปรเจกต์ (Donation)</h2><p className="text-slate-400 max-w-md mx-auto text-sm">เงินบริจาคจะถูกส่งเข้า Treasury โดยตรง เพื่อใช้ในการพัฒนาและบำรุงรักษาระบบ</p></div><div className="flex justify-center gap-4"><button onClick={() => setDonateType("ETH")} className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all ${donateType === 'ETH' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}`}><Wallet className="w-4 h-4" /> ETH</button><button onClick={() => setDonateType("ERC20")} className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all ${donateType === 'ERC20' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'}`}><Coins className="w-4 h-4" /> USDT / Token</button></div><div className="max-w-sm mx-auto space-y-4">{donateType === 'ERC20' && (<input type="text" placeholder="Token/USDT Address (0x...)" value={donateTokenAddress} onChange={(e) => setDonateTokenAddress(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-sm ${glassInput}`} />)}<div className="relative"><input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full rounded-xl px-4 py-3 font-mono text-white text-center text-2xl font-bold outline-none transition-colors ${donateType === 'ETH' ? 'focus:border-pink-500' : 'focus:border-purple-500'} ${glassInput}`} /><span className="absolute right-4 top-5 text-slate-500 text-sm font-bold">{donateType === 'ETH' ? 'ETH' : 'TOKENS'}</span></div>{donateType === 'ETH' && (<div className="flex gap-2 justify-center">{[0.01, 0.05, 0.1].map((val) => <button key={val} onClick={() => setAmount(val.toString())} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg border border-slate-700 transition-colors">{val} ETH</button>)}</div>)}</div><button onClick={handleDonate} disabled={isLoading || !amount} className={`w-full max-w-sm mx-auto text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${donateType === 'ETH' ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/20' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'}`}>{isLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Heart className="w-5 h-5 fill-current" />} {isLoading ? "กำลังดำเนินการ..." : `ยืนยันบริจาค ${donateType}`}</button></div>
            )}
            {activeTab === 'admin' && (<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"><div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" /><div><h3 className="font-bold text-yellow-500">Admin Zone</h3><p className="text-sm text-yellow-200/70">สำหรับเจ้าของสัญญาเท่านั้น</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className={`p-6 rounded-xl ${glassPanel}`}><label className="block text-sm text-slate-400 mb-2">ค่าธรรมเนียมใหม่ (BPS)</label><div className="flex gap-2"><input type="number" placeholder="20" value={newFee} onChange={(e) => setNewFee(e.target.value)} className={`flex-1 rounded-lg px-3 py-2 text-sm ${glassInput}`} /><button onClick={handleUpdateFee} className={`px-4 rounded-lg text-sm ${glassButton}`}>บันทึก</button></div></div><div className={`p-6 rounded-xl ${glassPanel}`}><label className="block text-sm text-slate-400 mb-2">เปลี่ยน Treasury Wallet</label><div className="flex gap-2"><input type="text" placeholder="0x..." value={newTreasury} onChange={(e) => setNewTreasury(e.target.value)} className={`flex-1 rounded-lg px-3 py-2 text-sm ${glassInput}`} /><button onClick={handleUpdateTreasury} className={`px-4 rounded-lg text-sm ${glassButton}`}>บันทึก</button></div></div></div></div>)}
            {statusMsg && (<div className={`mt-6 p-4 rounded-xl border text-center animate-pulse ${statusType === 'error' ? 'bg-red-900/20 border-red-900/50 text-red-400' : statusType === 'success' ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' : 'bg-blue-900/20 border-blue-900/50 text-blue-400'}`}><span className="font-medium">{statusMsg}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;