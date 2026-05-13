import React, { useState, useEffect } from 'react';
import { ShoppingBag, ShoppingCart, X, Plus, Minus, Trash2, Package, Edit2, Save, Settings, Box, History, MapPin, RefreshCw } from 'lucide-react';
import { addDoc, collection, updateDoc, deleteDoc, doc as firestoreDoc } from 'firebase/firestore';
import { glassPanel, glassButton, glassInput, headingFont } from '../../styles';
import { ERC20_ABI, CONTRACT_ABI, PROMPTPAY_ID, USD_THB_RATE, SHOP_WALLET_ADDRESS, ADMIN_WALLETS } from '../../constants';
import { recordTransaction } from '../../utils/recordTx';

export default function ShopTab({ account, signer, ethersLib, provider, db, appId, firebaseUser, currentPrice, isLoading, setIsLoading, showStatus, transactions, shopOrders, isOwner, products, contractAddress }) {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [shopCategory, setShopCategory] = useState("All");
    const [paymentMethod, setPaymentMethod] = useState("ETH");
    const [usdtAddress, setUsdtAddress] = useState("");
    const [usdtBalance, setUsdtBalance] = useState("0.00");
    const [isSellerMode, setIsSellerMode] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", category: "Merch", image: "" });
    const [editingProductId, setEditingProductId] = useState(null);
    const [shippingAddress, setShippingAddress] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            if (!account || !ethersLib || !ethersLib.utils.isAddress(usdtAddress)) {
                setUsdtBalance("0.00"); return;
            }
            try {
                const c = new ethersLib.Contract(usdtAddress, ERC20_ABI, provider);
                const [bal, dec] = await Promise.all([c.balanceOf(account), c.decimals()]);
                setUsdtBalance(parseFloat(ethersLib.utils.formatUnits(bal, dec)).toFixed(4));
            } catch { setUsdtBalance("0.00"); }
        };
        fetch();
    }, [usdtAddress, account, ethersLib, provider]);

    const ethToUsd = currentPrice > 0 ? currentPrice : 3000;
    const cartTotalETH = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const cartTotalTHB = Math.ceil(cartTotalETH * ethToUsd * USD_THB_RATE);

    const getTarget = () => {
        if (ethersLib?.utils.isAddress(SHOP_WALLET_ADDRESS)) return SHOP_WALLET_ADDRESS;
        if (ADMIN_WALLETS.length > 0) return ADMIN_WALLETS[0];
        return "0x000000000000000000000000000000000000dEaD";
    };

    const prodPath = () => collection(db, 'artifacts', appId, 'public', 'data', 'products');

    const addToCart = (product) => { setCart(prev => { const ex = prev.find(i => i.id === product.id); return ex ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...product, qty: 1 }]; }); showStatus(`${product.name} เพิ่มลงตะกร้าแล้ว`, "success"); };
    const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
    const updateQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));

    const handleSaveProduct = async () => {
        if (!newProduct.name || !newProduct.price) return showStatus("กรุณากรอกชื่อและราคา", "error");
        if (!db) return showStatus("Firebase ไม่พร้อมใช้งาน", "error");
        const img = newProduct.image || "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=500&q=80";
        const prodData = { name: newProduct.name, price: parseFloat(newProduct.price), category: newProduct.category, image: img };
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
            setNewProduct({ name: "", price: "", category: "Merch", image: "" });
        } catch (err) { showStatus("บันทึกไม่สำเร็จ: " + err.message, "error"); }
        finally { setIsSaving(false); }
    };

    const startEdit = (p) => { setNewProduct({ ...p, price: p.price.toString() }); setEditingProductId(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const cancelEdit = () => { setNewProduct({ name: "", price: "", category: "Merch", image: "" }); setEditingProductId(null); };

    const deleteProduct = async (id) => {
        if (editingProductId === id) cancelEdit();
        if (!db || typeof id !== 'string') { showStatus("ลบไม่ได้: สินค้านี้ยังไม่ได้บันทึกลง Firebase", "error"); return; }
        try {
            await deleteDoc(firestoreDoc(db, 'artifacts', appId, 'public', 'data', 'products', id));
            showStatus("ลบสินค้าแล้ว", "info");
        } catch (err) { showStatus("ลบไม่สำเร็จ: " + err.message, "error"); }
    };

    const handleCheckout = async () => {
        if (!account && paymentMethod !== 'PROMPTPAY') return showStatus("กรุณาเชื่อมต่อกระเป๋าก่อนชำระเงิน", "error");
        if (cart.length === 0 || (!ethersLib && paymentMethod !== 'PROMPTPAY')) return;
        if (!shippingAddress.trim()) return showStatus("กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน", "error");
        setIsLoading(true);
        showStatus("กำลังดำเนินการชำระเงิน...", "info");
        const items = cart.map(i => `${i.name} (x${i.qty})`).join(', ');
        const target = getTarget();
        const useContract = contractAddress && ethersLib?.utils.isAddress(contractAddress);
        try {
            if (paymentMethod === 'ETH') {
                const value = ethersLib.utils.parseEther(cartTotalETH.toFixed(6).toString());
                if (useContract) {
                    try {
                        const c = new ethersLib.Contract(contractAddress, CONTRACT_ABI, signer);
                        const tx = await c.transferETHWithReferral(target, ADMIN_WALLETS[0], { value });
                        await tx.wait();
                    } catch {
                        const tx = await signer.sendTransaction({ to: target, value });
                        await tx.wait();
                    }
                } else {
                    const tx = await signer.sendTransaction({ to: target, value });
                    await tx.wait();
                }
                await recordTransaction(db, appId, firebaseUser, account, "SHOP_BUY", cartTotalETH.toFixed(6), "ETH", target, items, shippingAddress);
            } else if (paymentMethod === 'USDT') {
                if (!usdtAddress) throw new Error("กรุณาระบุ USDT Contract Address");
                const tc = new ethersLib.Contract(usdtAddress, ERC20_ABI, signer);
                const dec = await tc.decimals();
                const usdVal = cartTotalETH * ethToUsd;
                const wei = ethersLib.utils.parseUnits(usdVal.toFixed(2).toString(), dec);
                const bal = await tc.balanceOf(account);
                if (bal.lt(wei)) throw new Error(`ยอดเงิน USDT ไม่เพียงพอ`);
                if (useContract) {
                    try {
                        const allowance = await tc.allowance(account, contractAddress);
                        if (allowance.lt(wei)) {
                            showStatus("กำลัง Approve USDT...", "info");
                            const approveTx = await tc.approve(contractAddress, wei);
                            await approveTx.wait();
                        }
                        const c = new ethersLib.Contract(contractAddress, CONTRACT_ABI, signer);
                        const tx = await c.transferTokenWithReferral(usdtAddress, target, wei, ADMIN_WALLETS[0]);
                        await tx.wait();
                    } catch {
                        const tx = await tc.transfer(target, wei);
                        await tx.wait();
                    }
                } else {
                    const tx = await tc.transfer(target, wei);
                    await tx.wait();
                }
                await recordTransaction(db, appId, firebaseUser, account, "SHOP_BUY", usdVal.toFixed(2), "USDT", target, items, shippingAddress);
            } else if (paymentMethod === 'PROMPTPAY') {
                await new Promise(r => setTimeout(r, 2000));
                await recordTransaction(db, appId, firebaseUser, account, "SHOP_BUY_QR", cartTotalTHB, "THB", "PromptPay", items, shippingAddress);
            }
            showStatus("ชำระเงินสำเร็จ! ขอบคุณที่อุดหนุน 🎉", "success");
            const buyer = account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Guest";
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'community_chat'), { text: `🛍️ NEW ORDER!\n👤 ${buyer}\n📦 ${items}\n💰 ${paymentMethod === 'PROMPTPAY' ? `${cartTotalTHB.toLocaleString()} THB` : `${cartTotalETH.toFixed(4)} ETH`} via ${paymentMethod}`, sender: "BoomShop Bot 🤖", isWallet: false, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=BoomShop", timestamp: Date.now() });
            setCart([]); setShippingAddress(""); setIsCartOpen(false);
        } catch (err) { showStatus("การชำระเงินล้มเหลว: " + (err.reason || err.message), "error"); }
        finally { setIsLoading(false); }
    };

    const filtered = products.filter(p => shopCategory === 'All' || p.category === shopCategory);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-[500px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div><h2 className={`text-2xl font-bold text-white flex items-center gap-2 ${headingFont}`}><ShoppingBag className="w-6 h-6 text-blue-400" /> BoomShop</h2><p className="text-slate-400 text-sm">สินค้าคุณภาพสำหรับชาว Crypto & Tech</p></div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    {["All","Merch","Gadget","Mining","Digital","NFT"].map(cat => (<button key={cat} onClick={() => setShopCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${shopCategory === cat ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 text-slate-400 hover:text-white'}`}>{cat}</button>))}
                </div>
            </div>

            {cart.length > 0 && <button onClick={() => setIsCartOpen(!isCartOpen)} className="absolute top-4 right-4 z-20 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg"><div className="relative"><ShoppingCart className="w-6 h-6" /><span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{cart.reduce((a,b) => a+b.qty, 0)}</span></div></button>}

            {isOwner && <div className="flex justify-end mb-4"><button onClick={() => setIsSellerMode(!isSellerMode)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${isSellerMode ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-yellow-500 border border-yellow-500/50'}`}>{isSellerMode ? <X className="w-4 h-4"/> : <Settings className="w-4 h-4"/>}{isSellerMode ? "ปิดโหมดผู้ขาย" : "จัดการร้านค้า"}</button></div>}

            {isOwner && isSellerMode ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl ${glassPanel} flex items-center justify-between`}><div><p className="text-slate-400 text-xs uppercase">Products</p><h3 className={`text-2xl font-bold text-white ${headingFont}`}>{products.length}</h3></div><div className="p-3 bg-blue-500/20 rounded-lg"><Box className="w-6 h-6 text-blue-400"/></div></div>
                        <div className={`p-4 rounded-xl ${glassPanel} flex items-center justify-between`}><div><p className="text-slate-400 text-xs uppercase">Orders</p><h3 className={`text-2xl font-bold text-white ${headingFont}`}>{shopOrders.length}</h3></div><div className="p-3 bg-emerald-500/20 rounded-lg"><ShoppingBag className="w-6 h-6 text-emerald-400"/></div></div>
                    </div>
                    <div className={`p-6 rounded-2xl ${glassPanel}`}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">{editingProductId ? <Edit2 className="w-5 h-5 text-yellow-400"/> : <Plus className="w-5 h-5 text-emerald-400"/>}{editingProductId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="ชื่อสินค้า" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className={`rounded-lg px-4 py-2 text-sm ${glassInput}`}/>
                            <input type="number" placeholder="ราคา (ETH)" min="0" step="any" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className={`rounded-lg px-4 py-2 text-sm ${glassInput}`}/>
                            <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className={`rounded-lg px-4 py-2 text-sm ${glassInput}`}>{["Merch","Gadget","Mining","Digital","NFT"].map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}</select>
                            <input type="text" placeholder="URL รูปภาพ (Optional)" value={newProduct.image} onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} className={`rounded-lg px-4 py-2 text-sm ${glassInput}`}/>
                        </div>
                        <div className="flex gap-2 mt-4">
                            {editingProductId && <button onClick={cancelEdit} className="w-1/3 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-bold">ยกเลิก</button>}
                            <button onClick={handleSaveProduct} disabled={isSaving} className={`flex-1 text-white py-2 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 ${editingProductId ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin"/> : editingProductId ? <><Save className="w-4 h-4 inline mr-1"/>บันทึกการแก้ไข</> : <><Plus className="w-4 h-4 inline mr-1"/>เพิ่มสินค้า</>}
                            </button>
                        </div>
                        {!db && <p className="text-xs text-yellow-400 mt-2 text-center">⚠ Firebase ยังไม่พร้อม — สินค้าจะไม่ถูกบันทึก</p>}
                    </div>
                    <div className={`p-6 rounded-2xl ${glassPanel}`}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-yellow-400"/> จัดการสินค้า</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {products.map(p => (<div key={p.id} className={`flex justify-between items-center p-3 rounded-lg border ${editingProductId === p.id ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-slate-950/50 border-slate-700/50'}`}><div className="flex items-center gap-3"><img src={p.image} className="w-10 h-10 rounded-md object-cover" alt=""/><div><p className="font-bold text-sm text-white">{p.name}</p><p className="text-xs text-slate-400">{p.category} • {p.price} ETH {typeof p.id !== 'string' && <span className="text-yellow-500">(ยังไม่ได้บันทึก)</span>}</p></div></div><div className="flex gap-2"><button onClick={() => { setIsSellerMode(true); startEdit(p); }} className="text-yellow-400 hover:bg-yellow-500/10 p-2 rounded-lg"><Edit2 className="w-4 h-4"/></button><button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg" title={typeof p.id !== 'string' ? 'ต้องบันทึกลง Firebase ก่อนจึงจะลบได้' : 'ลบสินค้า'}><Trash2 className="w-4 h-4"/></button></div></div>))}
                        </div>
                    </div>
                    <div className={`p-6 rounded-2xl ${glassPanel}`}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-blue-400"/> รายการสั่งซื้อล่าสุด</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {shopOrders.length === 0 && <p className="text-slate-500 text-sm text-center py-4">ยังไม่มีออเดอร์</p>}
                            {shopOrders.map(o => (<div key={o.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800"><div className="flex justify-between items-start"><div><div className="text-white font-bold text-sm">{o.details || "Unknown"}</div><div className="text-xs text-slate-500">Buyer: {o.from}</div><div className="text-xs text-slate-500">{new Date(o.timestamp).toLocaleString()}</div></div><div className="text-right"><div className="text-emerald-400 font-bold">{o.amount} {o.token}</div><span className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-800">Paid</span></div></div>{o.shippingAddress && <div className="mt-2 bg-slate-900 p-2 rounded border border-slate-700"><p className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Shipping</p><p className="text-xs text-slate-300 whitespace-pre-wrap">{o.shippingAddress}</p></div>}</div>))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(product => (
                        <div key={product.id} className={`rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all group flex flex-col relative ${glassPanel}`}>
                            {isOwner && (<div className="absolute top-2 left-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setIsSellerMode(true); startEdit(product); }} className="bg-yellow-500/80 hover:bg-yellow-600 text-white p-1.5 rounded-lg"><Edit2 className="w-4 h-4"/></button><button onClick={() => deleteProduct(product.id)} className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-lg"><Trash2 className="w-4 h-4"/></button></div>)}
                            <div className="h-48 overflow-hidden relative"><img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /><div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs text-white border border-white/10">{product.category}</div></div>
                            <div className="p-4 flex-1 flex flex-col"><h3 className={`font-bold text-white text-lg mb-1 ${headingFont}`}>{product.name}</h3><div className="mt-auto flex items-center justify-between pt-4"><div className="text-emerald-400 font-bold font-mono">{product.price} ETH</div><button onClick={() => addToCart(product)} className={`p-2 rounded-lg ${glassButton}`}><Plus className="w-5 h-5" /></button></div></div>
                        </div>
                    ))}
                </div>
            )}

            {isCartOpen && (
                <div className="absolute top-0 right-0 w-full md:w-80 h-full bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl z-30 p-6 flex flex-col rounded-l-2xl">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800"><h3 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> ตะกร้าสินค้า</h3><button onClick={() => setIsCartOpen(false)}><X className="w-6 h-6 text-slate-400 hover:text-white" /></button></div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        {cart.length === 0 ? <div className="text-center text-slate-500 py-10"><Package className="w-12 h-12 mx-auto mb-2 opacity-20" /><p>ตะกร้าว่างเปล่า</p></div>
                            : cart.map(item => (<div key={item.id} className="flex gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800"><img src={item.image} className="w-16 h-16 rounded-lg object-cover" alt="" /><div className="flex-1"><h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4><p className="text-xs text-emerald-400 mb-2">{item.price} ETH</p><div className="flex items-center gap-2"><button onClick={() => updateQty(item.id, -1)} className="p-1 bg-slate-800 rounded text-slate-400 hover:text-white"><Minus className="w-3 h-3" /></button><span className="text-xs font-mono w-4 text-center">{item.qty}</span><button onClick={() => updateQty(item.id, 1)} className="p-1 bg-slate-800 rounded text-slate-400 hover:text-white"><Plus className="w-3 h-3" /></button><button onClick={() => removeFromCart(item.id)} className="ml-auto p-1 text-red-400 hover:bg-red-900/20 rounded"><Trash2 className="w-3 h-3" /></button></div></div></div>))}
                    </div>
                    <div className="mt-4 border-t border-slate-800 pt-4">
                        <h4 className="text-xs text-slate-400 mb-2 uppercase font-bold flex items-center gap-1"><History className="w-3 h-3"/> ประวัติการซื้อ</h4>
                        <div className="max-h-32 overflow-y-auto space-y-2 text-xs">
                            {transactions.filter(t => t.type.includes('SHOP_BUY') && t.from === account).length === 0 ? <p className="text-slate-600">ไม่มีประวัติ</p>
                                : transactions.filter(t => t.type.includes('SHOP_BUY') && t.from === account).slice(0,3).map(t => (<div key={t.id} className="flex justify-between text-slate-300"><span className="truncate w-24">{t.details || "Order"}</span><span className="text-emerald-500">{t.amount} {t.token}</span></div>))}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 mb-2 block uppercase">ที่อยู่จัดส่ง <span className="text-red-400">*</span></label>
                            <textarea placeholder="ชื่อ-นามสกุล, เบอร์โทร, ที่อยู่, จังหวัด, รหัสไปรษณีย์" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm h-24 resize-none ${glassInput}`} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 mb-2 block uppercase">Payment</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['ETH','USDT','PROMPTPAY'].map(m => (<button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 text-xs font-bold rounded-lg border ${paymentMethod === m ? (m === 'ETH' ? 'bg-blue-600 border-blue-600' : m === 'USDT' ? 'bg-emerald-600 border-emerald-600' : 'bg-sky-600 border-sky-600') + ' text-white' : 'border-slate-700 text-slate-400'}`}>{m === 'PROMPTPAY' ? 'QR' : m}</button>))}
                            </div>
                        </div>
                        {paymentMethod === 'USDT' && <div><input type="text" placeholder="USDT Token Address" value={usdtAddress} onChange={(e) => setUsdtAddress(e.target.value)} className={`w-full rounded-lg px-3 py-2 text-sm ${glassInput}`}/><p className="text-xs text-right mt-1 text-emerald-400">Bal: {usdtBalance}</p></div>}
                        {paymentMethod === 'PROMPTPAY' && cart.length > 0 && <div className="bg-white p-3 rounded-xl flex flex-col items-center"><img src={`https://promptpay.io/${PROMPTPAY_ID}/${cartTotalTHB}.png`} alt="PromptPay" className="w-32 h-32" /><div className="text-slate-900 font-bold text-lg mt-2">{cartTotalTHB.toLocaleString()} THB</div></div>}
                        <div className="flex justify-between items-center text-sm"><span className="text-slate-400">Total</span><span className="text-xl font-bold text-white font-mono">{paymentMethod === 'PROMPTPAY' ? `${cartTotalTHB.toLocaleString()} THB` : `${cartTotalETH.toFixed(4)} ETH`}</span></div>
                        <button onClick={handleCheckout} disabled={cart.length === 0 || isLoading || !shippingAddress.trim()} className={`w-full text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${paymentMethod === 'PROMPTPAY' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-blue-600 hover:bg-blue-500'} disabled:opacity-50`}>{isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (paymentMethod === 'PROMPTPAY' ? "Confirm Payment" : "Pay with Crypto")}</button>
                    </div>
                </div>
            )}
        </div>
    );
}
