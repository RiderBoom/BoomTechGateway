import { useState, useEffect } from 'react';
import { ADMIN_WALLETS, CHAINS } from '../constants';

export function useWallet(showStatus) {
    const [ethersLib, setEthersLib] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState("");
    const [balance, setBalance] = useState("0.0000");
    const [isOwner, setIsOwner] = useState(false);
    const [chainId, setChainId] = useState(null);

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
            else { setAccount(""); setSigner(null); setBalance("0.0000"); setChainId(null); }
        });
        window.ethereum.on('chainChanged', () => window.location.reload());
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
            const network = await prov.getNetwork();
            setProvider(prov);
            setSigner(sign);
            setAccount(addr);
            setBalance(parseFloat(ethersLib.utils.formatEther(raw)).toFixed(4));
            setChainId(network.chainId);
            setIsOwner(ADMIN_WALLETS.some(a => a.toLowerCase() === addr.toLowerCase()));
            const chainName = CHAINS[network.chainId]?.name || `Chain ${network.chainId}`;
            showStatus(`เชื่อมต่อสำเร็จ! ✅ (${chainName})`, "success");
        } catch (err) {
            showStatus("เชื่อมต่อล้มเหลว: " + (err.message || err), "error");
        }
    };

    const switchChain = async (targetChainId) => {
        if (!window.ethereum) return;
        const hexId = '0x' + targetChainId.toString(16);
        try {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
        } catch (err) {
            if (err.code === 4902) {
                const chain = CHAINS[targetChainId];
                if (!chain) return showStatus("ไม่รองรับ Chain นี้", "error");
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: hexId,
                            chainName: chain.name,
                            nativeCurrency: { name: chain.symbol, symbol: chain.symbol, decimals: 18 },
                            rpcUrls: [chain.rpc],
                            blockExplorerUrls: [chain.explorer]
                        }]
                    });
                } catch (addErr) { showStatus("เพิ่ม Network ไม่สำเร็จ: " + addErr.message, "error"); }
            } else {
                showStatus("เปลี่ยน Network ไม่สำเร็จ", "error");
            }
        }
    };

    return { ethersLib, provider, signer, account, balance, setBalance, isOwner, connectWallet, chainId, switchChain };
}
