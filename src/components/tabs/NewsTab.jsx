import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Newspaper, RefreshCw, Clock, ExternalLink, Wifi, AlertTriangle } from 'lucide-react';
import { glassPanel, glassButton, headingFont } from '../../styles';

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 นาที

const CATEGORIES = [
    {
        id:         'invest',
        label:      'การลงทุน',
        emoji:      '📈',
        activeBg:   'bg-emerald-600/80 border-emerald-600',
        activeText: 'text-white',
        fallbackImg: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?auto=format&fit=crop&w=800&q=80',
    },
    {
        id:         'crypto',
        label:      'Crypto',
        emoji:      '₿',
        activeBg:   'bg-yellow-600/80 border-yellow-600',
        activeText: 'text-white',
        fallbackImg: 'https://images.unsplash.com/photo-1621504450168-38f684489e05?auto=format&fit=crop&w=800&q=80',
    },
    {
        id:         'tech',
        label:      'เทคโนโลยี',
        emoji:      '⚡',
        activeBg:   'bg-indigo-600/80 border-indigo-600',
        activeText: 'text-white',
        fallbackImg: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    },
    {
        id:         'health',
        label:      'สุขภาพ',
        emoji:      '💚',
        activeBg:   'bg-teal-600/80 border-teal-600',
        activeText: 'text-white',
        fallbackImg: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
    },
];

// แหล่งข้อมูลที่แสดงในหน้า (ตรงกับ api/news.js)
const SOURCE_LABELS = {
    invest: 'Reuters · Google News · SET',
    crypto: 'CoinDesk · CoinTelegraph · Decrypt',
    tech:   'TechCrunch · Ars Technica · The Verge',
    health: 'WHO · Google News',
};

function timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60_000)   return 'เมื่อกี้';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} นาทีที่แล้ว`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ชม.ที่แล้ว`;
    return new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

function SkeletonCard() {
    return (
        <div className={`rounded-xl overflow-hidden ${glassPanel} animate-pulse`}>
            <div className="h-48 bg-indigo-900/20"/>
            <div className="p-5 space-y-3">
                <div className="h-4 bg-indigo-900/20 rounded w-full"/>
                <div className="h-4 bg-indigo-900/20 rounded w-4/5"/>
                <div className="h-3 bg-indigo-900/20 rounded w-full"/>
                <div className="h-3 bg-indigo-900/20 rounded w-2/3"/>
            </div>
        </div>
    );
}

export default function NewsTab() {
    const [activeCatId, setActiveCatId]   = useState('invest');
    const [newsCache, setNewsCache]       = useState({});
    const [fetchedAt, setFetchedAt]       = useState({});
    const [isLoading, setIsLoading]       = useState(false);
    const [error, setError]               = useState(null);
    const timerRef                        = useRef(null);

    const cat = CATEGORIES.find(c => c.id === activeCatId);

    const fetchCategory = useCallback(async (catId, force = false) => {
        // ถ้ามีข้อมูลอยู่แล้วและยังไม่เก่า (< 5 นาที) และไม่ได้ force refresh → ข้าม
        const age = Date.now() - (fetchedAt[catId] || 0);
        if (!force && newsCache[catId]?.length && age < AUTO_REFRESH_MS) return;

        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/news?category=${catId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { articles } = await res.json();
            if (articles?.length) {
                setNewsCache(prev  => ({ ...prev,  [catId]: articles }));
                setFetchedAt(prev  => ({ ...prev,  [catId]: Date.now() }));
            } else {
                setError('ไม่พบข่าวในขณะนี้ กรุณาลองใหม่');
            }
        } catch (e) {
            setError('โหลดข่าวไม่สำเร็จ: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    }, [newsCache, fetchedAt]);

    // โหลดเมื่อเปลี่ยน tab
    useEffect(() => {
        fetchCategory(activeCatId);
    }, [activeCatId, fetchCategory]);

    // Auto-refresh ทุก 5 นาที
    useEffect(() => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => fetchCategory(activeCatId, true), AUTO_REFRESH_MS);
        return () => clearInterval(timerRef.current);
    }, [activeCatId, fetchCategory]);

    const articles  = newsCache[activeCatId] || [];
    const lastFetch = fetchedAt[activeCatId];

    return (
        <div className="space-y-6 animate-slide-up">

            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h2 className={`text-xl font-bold text-white flex items-center gap-2 ${headingFont}`}>
                        <Newspaper className="w-6 h-6 text-indigo-400"/> ข่าวสาร & บทความ
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Wifi className="w-3 h-3 text-emerald-400"/>
                        {SOURCE_LABELS[activeCatId]}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastFetch && (
                        <span className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"/>
                            อัปเดต {timeAgo(lastFetch)}
                        </span>
                    )}
                    <button
                        onClick={() => fetchCategory(activeCatId, true)}
                        disabled={isLoading}
                        className={`p-2 rounded-lg group ${glassButton} disabled:opacity-50`}
                        title="รีเฟรชข่าว"
                    >
                        <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin text-indigo-400' : ''}`}/>
                    </button>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-yellow-900/10 border border-yellow-700/30 text-yellow-300/80 text-xs leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-yellow-500"/>
                <span>
                    ข่าวสารและบทความรวบรวมจากแหล่งข้อมูลภายนอก <strong>เพื่อการอ้างอิงเท่านั้น</strong> ไม่ถือเป็นคำแนะนำการลงทุนหรือคำแนะนำทางการแพทย์
                    BoomTech Gateway ไม่รับรองความถูกต้องของเนื้อหาและไม่รับผิดชอบต่อการตัดสินใจที่เกิดจากข่าวสารเหล่านี้
                </span>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setActiveCatId(c.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            activeCatId === c.id
                                ? `${c.activeBg} ${c.activeText}`
                                : 'border-indigo-500/20 text-slate-400 hover:text-white hover:border-indigo-500/40 bg-transparent'
                        }`}
                    >
                        <span>{c.emoji}</span>{c.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading && articles.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3,4,5,6].map(i => <SkeletonCard key={i}/>)}
                </div>
            ) : error && articles.length === 0 ? (
                <div className="text-center py-20 text-slate-500 space-y-3">
                    <Newspaper className="w-12 h-12 mx-auto opacity-20"/>
                    <p>{error}</p>
                    <button
                        onClick={() => fetchCategory(activeCatId, true)}
                        className="text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                    >
                        ลองใหม่
                    </button>
                </div>
            ) : articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map(article => (
                        <a
                            key={article.id}
                            href={article.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className={`block rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group flex flex-col ${glassPanel}`}
                        >
                            {/* Image */}
                            <div className="h-48 overflow-hidden relative bg-slate-900">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={e => {
                                        if (!e.target.dataset.fb) {
                                            e.target.dataset.fb = '1';
                                            e.target.src = cat?.fallbackImg || '';
                                        }
                                    }}
                                    loading="lazy"
                                />
                                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full border border-white/10 max-w-[120px] truncate">
                                    {article.source}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className={`text-white font-bold text-base leading-tight mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2 ${headingFont}`}>
                                    {article.title}
                                </h3>
                                {article.description && (
                                    <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1 leading-relaxed">
                                        {article.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-indigo-500/10 pt-3 mt-auto">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3"/>
                                        {timeAgo(article.publishedAt)}
                                    </span>
                                    <span className="flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                                        อ่านต่อ <ExternalLink className="w-3 h-3"/>
                                    </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-slate-500 space-y-2">
                    <Newspaper className="w-12 h-12 mx-auto opacity-20"/>
                    <p>ไม่พบข่าว กรุณาลองใหม่</p>
                </div>
            )}
        </div>
    );
}
