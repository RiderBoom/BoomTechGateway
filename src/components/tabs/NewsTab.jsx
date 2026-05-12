import React, { useState, useEffect } from 'react';
import { Newspaper, RefreshCw, Clock, ExternalLink } from 'lucide-react';
import { glassPanel, glassButton, headingFont } from '../../styles';

const FALLBACK = [{ id: 'f1', title: "Crypto Market Update", body: "The cryptocurrency market remains volatile...", imageurl: "https://images.unsplash.com/photo-1621504450168-38f684489e05", url: "#", source_info: { name: "Cointelegraph", img: "" }, published_on: Date.now() / 1000 }];

export default function NewsTab() {
    const [newsData, setNewsData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNews = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss');
            const data = await res.json();
            if (data.status === 'ok' && data.items.length > 0) {
                setNewsData(data.items.map(item => ({
                    id: item.guid, title: item.title,
                    body: item.description.replace(/<[^>]*>/g, '').slice(0, 150) + "...",
                    imageurl: item.enclosure?.link || item.thumbnail || "https://cointelegraph.com/assets/img/default.png",
                    url: item.link, source_info: { name: "Cointelegraph", img: "https://cointelegraph.com/favicon.ico" },
                    published_on: new Date(item.pubDate).getTime() / 1000
                })));
            } else { setNewsData(FALLBACK); }
        } catch { setNewsData(FALLBACK); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchNews(); }, []);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-2">
                <h2 className={`text-xl font-bold text-white flex items-center gap-2 ${headingFont}`}><Newspaper className="w-6 h-6 text-blue-400" /> ข่าวสารคริปโต (Cointelegraph)</h2>
                <button onClick={fetchNews} className={`p-2 rounded-lg group ${glassButton}`}><RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin text-blue-400' : ''}`}/></button>
            </div>
            {isLoading ? <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-slate-500" /></div>
                : newsData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {newsData.map(item => (
                            <a href={item.url} target="_blank" rel="noreferrer" key={item.id} className={`block rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group flex flex-col ${glassPanel}`}>
                                <div className="h-48 overflow-hidden relative bg-slate-950"><img src={item.imageurl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1621504450168-38f684489e05?auto=format&fit=crop&w=800&q=80"; }} /><div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full border border-white/10 flex items-center gap-1"><img src={item.source_info.img} className="w-3 h-3 rounded-full" alt="" onError={(e)=>e.target.style.display='none'}/>{item.source_info.name}</div></div>
                                <div className="p-5 flex-1 flex flex-col"><h3 className={`text-white font-bold text-lg leading-tight mb-3 group-hover:text-blue-400 transition-colors line-clamp-2 ${headingFont}`}>{item.title}</h3><p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1">{item.body}</p><div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800 pt-3"><div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.published_on * 1000).toLocaleDateString()}</div><span className="flex items-center gap-1 group-hover:text-blue-400">อ่านต่อ <ExternalLink className="w-3 h-3" /></span></div></div>
                            </a>
                        ))}
                    </div>
                ) : <div className="text-center py-20 text-slate-500">ไม่พบข้อมูลข่าวสาร</div>}
        </div>
    );
}
