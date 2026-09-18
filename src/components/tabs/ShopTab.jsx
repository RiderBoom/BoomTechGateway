import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShoppingBag, ShoppingCart, X, Plus, Minus, Trash2, Package, Edit2, Save, Settings, Box, History, MapPin, RefreshCw, ImagePlus, Tag, FolderPlus } from 'lucide-react';
import { addDoc, collection, updateDoc, deleteDoc, setDoc, doc as firestoreDoc } from 'firebase/firestore';
import { glassPanel, glassButton, glassInput, headingFont } from '../../styles';
import { ERC20_ABI, PROMPTPAY_ID, USD_THB_RATE, SHOP_WALLET_ADDRESS, ADMIN_WALLETS, INITIAL_PRODUCTS, SANDBOX_MODE } from '../../constants';
import { recordTransaction } from '../../utils/recordTx';
import ConsentCheckbox from '../ConsentCheckbox';

export default function ShopTab({ account, signer, ethersLib, provider, db, appId, firebaseUser, ethUsdPrice, isLoading, setIsLoading, showStatus, transactions, shopOrders, isOwner, products, collections, paymentConfig }) {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [shopCategory, setShopCategory] = useState("All");
    const [paymentMethod, setPaymentMethod] = useState("ETH");
    const [usdtAddress, setUsdtAddress] = useState("");
    const [usdtBalance, setUsdtBalance] = useState("0.00");
    const [isSellerMode, setIsSellerMode] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", category: "", image: "" });
    const [editingProductId, setEditingProductId] = useState(null);
    const [shippingAddress, setShippingAddress] = useState("");
    const [cartConsent, setCartConsent] = useState(false);
    const [cartConsentTouched, setCartConsentTouched] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState("");
    const [newColName, setNewColName] = useState("");
    const [isSavingCol, setIsSavingCol] = useState(false);
    const fileInputRef = useRef(null);

    const allCollections = useMemo(
        () => collections?.length > 0 ? collections : ["Merch", "Gadget", "Mining", "Digital", "NFT"],
        [collections]
    );

    // ช่องทางชำระเงินที่ Admin เปิดใช้
    const cfg = paymentConfig || { eth: true, usdt: true, promptpay: true };
    const PAYMENT_STYLES = {
        ETH:       { activeClass: 'bg-indigo-600 border-indigo-600 text-white' },
        USDT:      { activeClass: 'bg-emerald-600 border-emerald-600 text-white' },
        PROMPTPAY: { activeClass: 'bg-sky-600 border-sky-600 text-white' },
    };
    const availablePayments = useMemo(() => [
        cfg.eth       && { id: 'ETH',       label: 'ETH' },
        cfg.usdt      && { id: 'USDT',      label: 'USDT' },
        cfg.promptpay && { id: 'PROMPTPAY', label: 'PromptPay' },
    ].filter(Boolean), [cfg.eth, cfg.usdt, cfg.promptpay]);

    // Auto-switch ถ้าช่องทางที่เลือกอยู่ถูก Admin ปิด
    useEffect(() => {
        const active = paymentMethod.toLowerCase();
        const still = (active === 'eth' && cfg.eth) || (active === 'usdt' && cfg.usdt) || (active === 'promptpay' && cfg.promptpay);
        if (!still && availablePayments.length > 0) {
            setPaymentMethod(availablePayments[0].id);
        }
    }, [availablePayments, cfg.eth, cfg.usdt, cfg.promptpay, paymentMethod]);

    useEffect(() => {
        if (!newProduct.category && allCollections.length > 0) {
            setNewProduct(p => ({ ...p, category: allCollections[0] }));
        }
    }, [allCollections, newProduct.category]);

    useEffect(() => {
        const fetch = async () => {
            if (!account || !ethersLib || !ethersLib.utils.isAddress(usdtAddress)) { setUsdtBalance("0.00"); return; }
            try {
                const c = new ethersLib.Contract(usdtAddress, ERC20_ABI, provider);
                const [bal, dec] = await Promise.all([c.balanceOf(account), c.decimals()]);
                setUsdtBalance(parseFloat(ethersLib.utils.formatUnits(bal, dec)).toFixed(4));
            } catch { setUsdtBalance("0.00"); }
        };
        fetch();
    }, [usdtAddress, account, ethersLib, provider]);

    const ethToUsd = ethUsdPrice > 0 ? ethUsdPrice : 0;
    const cartTotalETH = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const cartTotalUSD = cartTotalETH * ethToUsd;
    const cartTotalTHB = Math.ceil(cartTotalUSD * USD_THB_RATE);
    const toThb = (ethAmt) => Math.ceil(ethAmt * ethToUsd * USD_THB_RATE);

    const getTarget = () => {
        if (ethersLib?.utils.isAddress(SHOP_WALLET_ADDRESS)) return SHOP_WALLET_ADDRESS;
        if (ADMIN_WALLETS.length > 0) return ADMIN_WALLETS[0];
        return "0x000000000000000000000000000000000000dEaD";
    };

    const prodPath = () => collection(db, 'artifacts', appId, 'public', 'data', 'products');

    const addToCart = (product) => {
        setCart(prev => {
            const ex = prev.find(i => i.id === product.id);
            return ex ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...product, qty: 1 }];
        });
        showStatus(`${product.name} เพิ่มลงตะกร้าแล้ว`, "success");
    };
    const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
    const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));

    const handleImageFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showStatus("รูปภาพต้องมีขนาดไม่เกิน 2MB", "error"); return; }
        const reader = new FileReader();
        reader.onload = (ev) => { setNewProduct(p => ({ ...p, image: ev.target.result })); setImagePreview(ev.target.result); };
        reader.readAsDataURL(file);
    };

    const handleSaveProduct = async () => {
        if (!newProduct.name || !newProduct.price) return showStatus("กรุณากรอกชื่อและราคา", "error");
        if (!db) return showStatus("Firebase ไม่พร้อมใช้งาน", "error");
        const img = newProduct.image || "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=500&q=80";
        const prodData = { name: newProduct.name, price: parseFloat(newProduct.price), category: newProduct.category || allCollections[0], image: img };
        setIsSaving(true);
        try {
            if (editingProductId && typeof editingProductId === 'string') {
                await updateDoc(firestoreDoc(db, 'artifacts', appId, 'public', 'data', 'products', editingProductId), prodData);
                showStatus("แก้ไขสินค้าเรียบร้อย ✅", "success");
            } else {
                await addDoc(prodPath(), { ...prodData, createdAt: Date.now() });
                showStatus("เพิ่มสินค้าเรียบร้อย ✅", "success");
            }
            setEditingProductId(null);
            setNewProduct({ name: "", price: "", category: allCollections[0] || "", image: "" });
            setImagePreview("");
        } catch (err) { showStatus("บันทึกไม่สำเร็จ: " + err.message, "error"); }
        finally { setIsSaving(false); }
    };

    const startEdit = (p) => { setNewProduct({ ...p, price: p.price.toString() }); setEditingProductId(p.id); setImagePreview(p.image || ""); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const cancelEdit = () => { setNewProduct({ name: "", price: "", category: allCollections[0] || "", image: "" }); setEditingProductId(null); setImagePreview(""); };

    const restoreInitialProducts = async () => {
        if (!db) return showStatus("Firebase ไม่พร้อม", "error");
        setIsSaving(true);
        try {
            await Promise.all(INITIAL_PRODUCTS.map(p =>
                addDoc(prodPath(), { name: p.name, price: p.price, category: p.category, image: p.image, createdAt: Date.now() })
            ));
            showStatus("นำเข้าสินค้าเริ่มต้น 6 รายการสำเร็จ ✅", "success");
        } catch (err) { showStatus("นำเข้าไม่สำเร็จ: " + err.message, "error"); }
        finally { setIsSaving(false); }
    };

    const deleteProduct = async (id) => {
        if (editingProductId === id) cancelEdit();
        if (!db || typeof id !== 'string') { showStatus("ลบไม่ได้: ยังไม่ได้บันทึกลง Firebase", "error"); return; }
        try { await deleteDoc(firestoreDoc(db, 'artifacts', appId, 'public', 'data', 'products', id)); showStatus("ลบสินค้าแล้ว", "info"); }
        catch (err) { showStatus("ลบไม่สำเร็จ: " + err.message, "error"); }
    };

    // จัดการ Collections
    const saveCollections = async (newList) => {
        if (!db) return;
        setIsSavingCol(true);
        try {
            await setDoc(firestoreDoc(db, 'artifacts', appId, 'public', 'data', 'app_settings', 'collections'), { list: newList });
        } catch (err) { showStatus("บันทึก collection ไม่สำเร็จ: " + err.message, "error"); }
        finally { setIsSavingCol(false); }
    };

    const addCollection = async () => {
        const name = newColName.trim();
        if (!name) return showStatus("กรุณากรอกชื่อ Collection", "error");
        if (allCollections.includes(name)) return showStatus("มี Collection นี้อยู่แล้ว", "error");
        const newList = [...allCollections, name];
        await saveCollections(newList);
        setNewColName("");
        showStatus(`เพิ่ม "${name}" แล้ว ✅`, "success");
    };

    const removeCollection = async (name) => {
        const newList = allCollections.filter(c => c !== name);
        await saveCollections(newList);
        if (shopCategory === name) setShopCategory("All");
        showStatus(`ลบ "${name}" แล้ว`, "info");
    };

    const getCartTotal = () => {
        if (paymentMethod === 'PROMPTPAY') return `${cartTotalTHB.toLocaleString()} THB`;
        if (paymentMethod === 'USDT') return `${cartTotalUSD.toFixed(2)} USDT`;
        return `${cartTotalETH.toFixed(6)} ETH`;
    };

    const handleCheckout = async () => {
        if (!account && paymentMethod !== 'PROMPTPAY') return showStatus("กรุณาเชื่อมต่อกระเป๋าก่อนชำระเงิน", "error");
        if (cart.length === 0 || (!ethersLib && paymentMethod !== 'PROMPTPAY')) return;
        if (!SANDBOX_MODE && ethToUsd <= 0) return showStatus("ยังดึงราคา ETH ไม่สำเร็จ กรุณาลองใหม่", "error");
        if (!shippingAddress.trim()) return showStatus("กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน", "error");

        const items = cart.map(i => `${i.name} (x${i.qty})`).join(', ');

        // ── Sandbox Mode: บันทึกจำลอง ไม่ส่งเงินจริง ──────────────────────
        if (SANDBOX_MODE) {
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 800));
            const sandboxToken = paymentMethod === 'PROMPTPAY' ? 'THB' : paymentMethod === 'USDT' ? 'USDT' : 'ETH';
            const sandboxAmt   = paymentMethod === 'PROMPTPAY' ? cartTotalTHB : paymentMethod === 'USDT' ? cartTotalUSD.toFixed(2) : cartTotalETH.toFixed(6);
            const sandboxType  = paymentMethod === 'PROMPTPAY' ? 'SHOP_BUY_QR' : 'SHOP_BUY';
            await recordTransaction(db, appId, firebaseUser, account || "Guest", sandboxType, sandboxAmt, sandboxToken, "PromptPay", items, shippingAddress, { paymentStatus: 'sandbox_demo' });
            showStatus(`🧪 [SANDBOX] จำลองการสั่งซื้อสำเร็จ — ไม่มีการตัดเงินจริง | ${items}`, "success");
            setCart([]); setShippingAddress(""); setIsCartOpen(false); setCartConsent(false); setCartConsentTouched(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        showStatus("กำลังดำเนินการชำระเงิน...", "info");
        const target = getTarget();
        try {
            if (paymentMethod === 'ETH') {
                const value = ethersLib.utils.parseEther(cartTotalETH.toFixed(6).toString());
                const tx = await signer.sendTransaction({ to: target, value });
                await tx.wait();
                await recordTransaction(db, appId, firebaseUser, account, "SHOP_BUY", cartTotalETH.toFixed(6), "ETH", target, items, shippingAddress);
            } else if (paymentMethod === 'USDT') {
                if (!usdtAddress) throw new Error("กรุณาระบุ USDT Contract Address");
                const tc = new ethersLib.Contract(usdtAddress, ERC20_ABI, signer);
                const dec = await tc.decimals();
                const wei = ethersLib.utils.parseUnits(cartTotalUSD.toFixed(2).toString(), dec);
                const bal = await tc.balanceOf(account);
                if (bal.lt(wei)) throw new Error(`ยอดเงิน USDT ไม่เพียงพอ (ต้องการ ${cartTotalUSD.toFixed(2)} USDT)`);
                const tx = await tc.transfer(target, wei);
                await tx.wait();
                await recordTransaction(db, appId, firebaseUser, account, "SHOP_BUY", cartTotalUSD.toFixed(2), "USDT", target, items, shippingAddress);
            } else if (paymentMethod === 'PROMPTPAY') {
                // บันทึก order พร้อมสถานะ "รอยืนยัน" — admin ต้องตรวจสอบการโอนเงินก่อนจัดส่ง
                await recordTransaction(db, appId, firebaseUser, account || "Guest", "SHOP_BUY_QR", cartTotalTHB, "THB", "PromptPay", items, shippingAddress, { paymentStatus: 'pending_verification' });
            }
            const successMsg = paymentMethod === 'PROMPTPAY'
                ? "บันทึกคำสั่งซื้อแล้ว ✅ ทีมงานจะยืนยันการรับเงินและจัดส่งภายใน 24 ชั่วโมง"
                : "ชำระเงินสำเร็จ! ขอบคุณที่อุดหนุน 🎉";
            showStatus(successMsg, "success");
            const buyer = account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Guest";
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'community_chat'), { text: `🛍️ NEW ORDER!\n👤 ${buyer}\n📦 ${items}\n💰 ${getCartTotal()} via ${paymentMethod}`, sender: "BoomShop Bot 🤖", isWallet: false, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=BoomShop", timestamp: Date.now() });
            setCart([]); setShippingAddress(""); setIsCartOpen(false); setCartConsent(false); setCartConsentTouched(false);
        } catch (err) { showStatus("การชำระเงินล้มเหลว: " + (err.reason || err.message), "error"); }
        finally { setIsLoading(false); }
    };

    const filtered = products.filter(p => shopCategory === 'All' || p.category === shopCategory);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-[500px]">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className={`text-2xl font-bold text-white flex items-center gap-2 ${headingFont}`}><ShoppingBag className="w-6 h-6 text-indigo-400"/> BoomShop</h2>
                    <p className="text-slate-400 text-sm">สินค้าคุณภาพสำหรับชาว Crypto & Tech</p>
                </div>
                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    {["All", ...allCollections].map(cat => (
                        <button key={cat} onClick={() => setShopCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${shopCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-indigo-500/20 text-slate-400 hover:text-white hover:border-indigo-500/50'}`}>{cat}</button>
                    ))}
                </div>
            </div>

            {cart.length > 0 && (
                <button onClick={() => setIsCartOpen(!isCartOpen)} className="absolute top-4 right-4 z-20 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-lg shadow-indigo-900/40">
                    <div className="relative"><ShoppingCart className="w-6 h-6"/><span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{cart.reduce((a,b) => a+b.qty, 0)}</span></div>
                </button>
            )}

            {/* ── NFT Legal Warning (พ.ร.ก. สินทรัพย์ดิจิทัล พ.ศ. 2561) ─────────── */}
            {shopCategory === 'NFT' && (
                <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-yellow-900/10 border border-yellow-600/30">
                    <span className="text-yellow-400 text-lg shrink-0">⚠️</span>
                    <div>
                        <p className="text-yellow-300 text-sm font-bold">คำเตือน: สินค้าประเภท NFT</p>
                        <p className="text-yellow-300/80 text-xs mt-1 leading-relaxed">
                            NFT บางประเภทอาจถือเป็น "สินทรัพย์ดิจิทัล" ภายใต้{' '}
                            <strong>พ.ร.ก. การประกอบธุรกิจสินทรัพย์ดิจิทัล พ.ศ. 2561</strong>{' '}
                            ซึ่งกำกับดูแลโดยสำนักงาน ก.ล.ต. การซื้อขายมีความเสี่ยง อาจสูญเสียมูลค่าทั้งหมด
                            ไม่ถือเป็นคำแนะนำการลงทุน
                        </p>
                    </div>
                </div>
            )}

            {isOwner && (
                <div className="flex justify-end mb-4">
                    <button onClick={() => setIsSellerMode(!isSellerMode)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${isSellerMode ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400 border border-indigo-500/30'}`}>
                        {isSellerMode ? <X className="w-4 h-4"/> : <Settings className="w-4 h-4"/>}
                        {isSellerMode ? "ปิดโหมดผู้ขาย" : "จัดการร้านค้า"}
                    </button>
                </div>
            )}

            {isOwner && isSellerMode ? (
                <div className="space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl ${glassPanel} flex items-center justify-between`}><div><p className="text-slate-400 text-xs uppercase">Products</p><h3 className={`text-2xl font-bold text-white ${headingFont}`}>{products.length}</h3></div><div className="p-3 bg-indigo-500/20 rounded-lg"><Box className="w-6 h-6 text-indigo-400"/></div></div>
                        <div className={`p-4 rounded-xl ${glassPanel} flex items-center justify-between`}><div><p className="text-slate-400 text-xs uppercase">Orders</p><h3 className={`text-2xl font-bold text-white ${headingFont}`}>{shopOrders.length}</h3></div><div className="p-3 bg-emerald-500/20 rounded-lg"><ShoppingBag className="w-6 h-6 text-emerald-400"/></div></div>
                    </div>

                    {/* Collections Manager */}
                    <div className={`p-6 rounded-2xl ${glassPanel}`}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FolderPlus className="w-5 h-5 text-indigo-400"/> จัดการ Collections</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {allCollections.map(col => (
                                <div key={col} className="flex items-center gap-1.5 bg-indigo-900/30 border border-indigo-500/20 rounded-full px-3 py-1.5">
                                    <Tag className="w-3 h-3 text-indigo-400"/>
                                    <span className="text-sm text-white">{col}</span>
                                    <button onClick={() => removeCollection(col)} className="text-slate-500 hover:text-red-400 ml-1 transition-colors"><X className="w-3 h-3"/></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="ชื่อ Collection ใหม่..."
                                value={newColName}
                                onChange={(e) => setNewColName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCollection()}
                                className={`flex-1 rounded-lg px-4 py-2 text-sm ${glassInput}`}
                            />
                            <button onClick={addCollection} disabled={isSavingCol} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all">
                                {isSavingCol ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} เพิ่ม
                            </button>
                        </div>
                    </div>

                    {/* Add/Edit Product */}
                    <div className={`p-6 rounded-2xl ${glassPanel}`}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            {editingProductId ? <Edit2 className="w-5 h-5 text-yellow-400"/> : <Plus className="w-5 h-5 text-emerald-400"/>}
                            {editingProductId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="ชื่อสินค้า" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className={`rounded-lg px-4 py-2 text-sm ${glassInput}`}/>
                            <input type="number" placeholder="ราคา (ETH)" min="0" step="any" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className={`rounded-lg px-4 py-2 text-sm ${glassInput}`}/>
                            <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className={`rounded-lg px-4 py-2 text-sm ${glassInput}`}>
                                {allCollections.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                            </select>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input type="text" placeholder="URL รูปภาพ (ไม่บังคับ)" value={newProduct.image?.startsWith('data:') ? '' : (newProduct.image || '')} onChange={(e) => { setNewProduct({...newProduct, image: e.target.value}); setImagePreview(e.target.value); }} className={`flex-1 rounded-lg px-4 py-2 text-sm ${glassInput}`}/>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white flex items-center gap-1.5 text-sm font-medium transition-all">
                                        <ImagePlus className="w-4 h-4"/><span className="hidden sm:inline">อัปโหลด</span>
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden"/>
                                </div>
                                {imagePreview && (
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-indigo-500/20 bg-slate-900">
                                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover"/>
                                        <button onClick={() => { setNewProduct(p => ({...p, image: ""})); setImagePreview(""); }} className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white p-1 rounded-md"><X className="w-3 h-3"/></button>
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-500">URL หรืออัปโหลดจากเครื่อง (ไม่เกิน 2MB)</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            {editingProductId && <button onClick={cancelEdit} className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-bold">ยกเลิก</button>}
                            <button onClick={handleSaveProduct} disabled={isSaving} className={`flex-1 text-white py-2 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 ${editingProductId ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin"/> : editingProductId ? <><Save className="w-4 h-4"/>บันทึกการแก้ไข</> : <><Plus className="w-4 h-4"/>เพิ่มสินค้า</>}
                            </button>
                        </div>
                        {!db && <p className="text-xs text-yellow-400 mt-2 text-center">⚠ Firebase ยังไม่พร้อม</p>}
                    </div>

                    {/* Product List */}
                    <div className={`p-6 rounded-2xl ${glassPanel}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-400"/> จัดการสินค้า</h3>
                            <button onClick={restoreInitialProducts} disabled={isSaving} className="text-xs px-3 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all">
                                <RefreshCw className={`w-3 h-3 ${isSaving ? 'animate-spin' : ''}`}/> นำเข้าสินค้าเริ่มต้น
                            </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                            {products.map(p => (
                                <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg border ${editingProductId === p.id ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-slate-950/50 border-indigo-500/10'}`}>
                                    <div className="flex items-center gap-3">
                                        <img src={p.image} className="w-10 h-10 rounded-md object-cover" alt=""/>
                                        <div>
                                            <p className="font-bold text-sm text-white">{p.name}</p>
                                            <p className="text-xs text-slate-400">{p.category} · {p.price} ETH {typeof p.id !== 'string' && <span className="text-yellow-500">(ยังไม่บันทึก)</span>}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setIsSellerMode(true); startEdit(p); }} className="text-yellow-400 hover:bg-yellow-500/10 p-2 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Orders */}
                    <div className={`p-6 rounded-2xl ${glassPanel}`}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-indigo-400"/> รายการสั่งซื้อ</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {shopOrders.length === 0 && <p className="text-slate-500 text-sm text-center py-4">ยังไม่มีออเดอร์</p>}
                            {shopOrders.map(o => (
                                <div key={o.id} className="bg-slate-950 p-4 rounded-xl border border-indigo-500/10">
                                    <div className="flex justify-between items-start">
                                        <div><div className="text-white font-bold text-sm">{o.details || "Unknown"}</div><div className="text-xs text-slate-500">Buyer: {o.from}</div></div>
                                        <div className="text-right"><div className="text-emerald-400 font-bold">{o.amount} {o.token}</div></div>
                                    </div>
                                    {o.shippingAddress && <div className="mt-2 bg-slate-900 p-2 rounded border border-slate-700"><p className="text-[10px] text-slate-400 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3"/> Shipping</p><p className="text-xs text-slate-300 whitespace-pre-wrap">{o.shippingAddress}</p></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(product => {
                        const thbPrice = Math.ceil(product.price * ethToUsd * USD_THB_RATE);
                        return (
                            <div key={product.id} className={`rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group flex flex-col relative ${glassPanel}`}>
                                {isOwner && (
                                    <div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setIsSellerMode(true); startEdit(product); }} className="bg-yellow-500/80 hover:bg-yellow-600 text-white p-1.5 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => deleteProduct(product.id)} className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                )}
                                <div className="h-48 overflow-hidden relative">
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs text-white border border-white/10">{product.category}</div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className={`font-bold text-white text-lg mb-1 ${headingFont}`}>{product.name}</h3>
                                    <div className="mt-auto flex items-center justify-between pt-4">
                                        <div className="text-emerald-300 font-bold text-xl">
                                            ฿{thbPrice.toLocaleString()}
                                        </div>
                                        <button onClick={() => addToCart(product)} className={`p-2 rounded-lg ${glassButton}`}><Plus className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Cart Drawer */}
            {isCartOpen && (
                <div className="absolute top-0 right-0 w-full md:w-80 h-full bg-slate-900/97 backdrop-blur-xl border-l border-indigo-500/10 shadow-2xl z-30 p-6 flex flex-col rounded-l-2xl">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                        <h3 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> ตะกร้าสินค้า</h3>
                        <button onClick={() => setIsCartOpen(false)}><X className="w-6 h-6 text-slate-400 hover:text-white"/></button>
                    </div>
                    <div className="overflow-y-auto max-h-[200px] space-y-2 pr-1">
                        {cart.length === 0
                            ? <div className="text-center text-slate-500 py-8"><Package className="w-10 h-10 mx-auto mb-2 opacity-20"/><p>ตะกร้าว่างเปล่า</p></div>
                            : cart.map(item => (
                                <div key={item.id} className="flex gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-indigo-500/10">
                                    <img src={item.image} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" alt=""/>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                                        <p className="text-xs text-emerald-300 mb-1.5">฿{toThb(item.price).toLocaleString()}</p>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-slate-800 rounded text-slate-400 hover:text-white"><Minus className="w-3 h-3"/></button>
                                            <span className="text-xs font-mono w-4 text-center">{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-slate-800 rounded text-slate-400 hover:text-white"><Plus className="w-3 h-3"/></button>
                                            <button onClick={() => removeFromCart(item.id)} className="ml-auto p-1 text-red-400 hover:bg-red-900/20 rounded"><Trash2 className="w-3 h-3"/></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    <div className="mt-2 border-t border-slate-800 pt-2">
                        <h4 className="text-xs text-slate-500 mb-1.5 uppercase font-bold flex items-center gap-1"><History className="w-3 h-3"/> ประวัติการซื้อ</h4>
                        <div className="max-h-16 overflow-y-auto space-y-1 text-xs">
                            {transactions.filter(t => t.type?.includes('SHOP_BUY') && t.from === account).length === 0
                                ? <p className="text-slate-600">ไม่มีประวัติ</p>
                                : transactions.filter(t => t.type?.includes('SHOP_BUY') && t.from === account).slice(0,3).map(t => (
                                    <div key={t.id} className="flex justify-between text-slate-300">
                                        <span className="truncate w-24">{t.details || "Order"}</span>
                                        <span className="text-emerald-500">{t.amount} {t.token}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="mt-2 pt-3 border-t border-slate-800 space-y-3">
                        <div>
                            <label className="text-xs text-slate-400 mb-2 block uppercase">ที่อยู่จัดส่ง <span className="text-red-400">*</span></label>
                            <textarea placeholder="ชื่อ-นามสกุล, เบอร์โทร, ที่อยู่, จังหวัด, รหัสไปรษณีย์" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm h-20 resize-none ${glassInput}`}/>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-2 block uppercase">ช่องทางชำระเงิน</label>
                            {availablePayments.length === 0 ? (
                                <p className="text-xs text-red-400 py-2">ขณะนี้ไม่มีช่องทางชำระเงินที่เปิดใช้งาน</p>
                            ) : (
                                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${availablePayments.length}, 1fr)` }}>
                                    {availablePayments.map(({ id, label }) => (
                                        <button key={id} onClick={() => setPaymentMethod(id)}
                                            className={`py-2 text-xs font-bold rounded-lg border transition-all ${paymentMethod === id ? PAYMENT_STYLES[id].activeClass : 'border-slate-700 text-slate-400 hover:text-white'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {paymentMethod === 'USDT' && (
                            <div>
                                <input type="text" placeholder="USDT Contract Address" value={usdtAddress} onChange={(e) => setUsdtAddress(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm ${glassInput}`}/>
                                <p className="text-xs text-right mt-1 text-emerald-400">Balance: {usdtBalance} USDT</p>
                            </div>
                        )}
                        {paymentMethod === 'PROMPTPAY' && cart.length > 0 && (
                            <div className="bg-white p-3 rounded-xl flex flex-col items-center">
                                <img src={`https://promptpay.io/${PROMPTPAY_ID}/${cartTotalTHB}.png`} alt="PromptPay" className="w-36 h-36"/>
                                <div className="text-slate-900 font-bold text-xl mt-2">฿{cartTotalTHB.toLocaleString()}</div>
                                <div className="text-slate-500 text-xs">≈ ${cartTotalUSD.toFixed(2)}</div>
                            </div>
                        )}
                        <div className="flex justify-between items-end px-3 py-3 bg-indigo-950/30 rounded-xl border border-indigo-500/10">
                            <div>
                                <span className="text-slate-400 text-xs uppercase">ยอดรวม</span>
                                {paymentMethod === 'ETH' && <p className="text-xs text-slate-500">{cartTotalETH.toFixed(6)} ETH</p>}
                                {paymentMethod === 'USDT' && <p className="text-xs text-slate-500">≈ {cartTotalETH.toFixed(6)} ETH</p>}
                                {paymentMethod === 'PROMPTPAY' && <p className="text-xs text-slate-500">≈ ${cartTotalUSD.toFixed(2)}</p>}
                            </div>
                            <span className="text-xl font-bold text-white font-mono">{getCartTotal()}</span>
                        </div>
                        <ConsentCheckbox
                            checked={cartConsent}
                            onChange={(val) => { setCartConsent(val); setCartConsentTouched(true); }}
                            touched={cartConsentTouched}
                        />
                        {/* Wrapper catches clicks on disabled button to trigger touched error */}
                        <div onClick={() => { if (!cartConsent) setCartConsentTouched(true); }}>
                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || isLoading || !shippingAddress.trim() || !cartConsent}
                                className={`w-full text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${paymentMethod==='PROMPTPAY'?'bg-sky-600 hover:bg-sky-500':paymentMethod==='USDT'?'bg-emerald-600 hover:bg-emerald-500':'bg-indigo-600 hover:bg-indigo-500'} disabled:opacity-50 transition-all active:scale-[0.98]`}
                            >
                                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <ShoppingBag className="w-5 h-5"/>}
                                {isLoading ? "กำลังดำเนินการ..." : (paymentMethod==='PROMPTPAY'?'ยืนยันชำระเงิน':`ชำระด้วย ${paymentMethod}`)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
