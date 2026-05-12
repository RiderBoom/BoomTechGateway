import { useState, useEffect } from 'react';
import { ADMIN_WALLETS } from '../constants';

export function useWallet(showStatus) {
    const [ethersLib, setEthersLib] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState("");
    const [balance, setBalance] = useState("0.0000");
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        if (typeof ethers !== 'undefined') { setEthersLib(ethers); return; }
        if (window.ethers) { setEthersLib(window.ethers); return; }
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js";
        script.async = true;
        script.onload = () => { if (window.ethers) setEthersLib(window.ethers); };
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        if (!window.ethereum || !ethersLib) return;
        window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
            if (accounts.length > 0) connectWallet();
        });
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) { setAccount(accounts[0]); window.location.reload(); }
            else { setAccount(""); setSigner(null); setBalance("0.0000"); }
        });
    }, [ethersLib]);

    useEffect(() => {
        if (!account || !provider || !ethersLib) return;
        const interval = setInterval(async () => {
            try {
                const raw = await provider.getBalance(account);
                setBalance(parseFloat(ethersLib.utils.formatEther(raw)).toFixed(4));
            } catch (e) { console.error("Balance poll error", e); }
        }, 15000);
        return () => clearInterval(interval);
    }, [account, provider, ethersLib]);

    const connectWallet = async () => {
        let walletProvider = window.ethereum;
        if (!walletProvider && window.BinanceChain) walletProvider = window.BinanceChain;
        if (!walletProvider) return alert("ไม่พบกระเป๋าเงิน! กรุณาติดตั้ง MetaMask หรือ Binance Wallet");
        if (!ethersLib) return showStatus("กำลังโหลดระบบ...", "info");
        try {
            const prov = new ethersLib.providers.Web3Provider(walletProvider);
            if (walletProvider.request) await walletProvider.request({ method: 'eth_requestAccounts' });
            else await prov.send("eth_requestAccounts", []);
            const sign = prov.getSigner();
            const addr = await sign.getAddress();
            const raw = await prov.getBalance(addr);
            setProvider(prov);
            setSigner(sign);
            setAccount(addr);
            setBalance(parseFloat(ethersLib.utils.formatEther(raw)).toFixed(4));
            setIsOwner(ADMIN_WALLETS.some(a => a.toLowerCase() === addr.toLowerCase()));
            showStatus("เชื่อมต่อกระเป๋าสำเร็จ! ✅", "success");
        } catch (err) {
            showStatus("เชื่อมต่อล้มเหลว: " + (err.message || err), "error");
        }
    };

    return { ethersLib, provider, signer, account, balance, setBalance, isOwner, connectWallet };
}
