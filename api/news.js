/**
 * Vercel Serverless Function — Real-time News from RSS Feeds
 *
 * ดึง RSS feeds จากแหล่งข่าวจริง server-side (ไม่มีปัญหา CORS)
 * Cache 5 นาทีที่ Vercel Edge เพื่อไม่ให้ hammering ต้นทาง
 *
 * GET /api/news?category=invest|crypto|tech|health
 * Response: { articles: Article[], fetchedAt: number }
 */

import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
    ignoreAttributes:     false,
    attributeNamePrefix:  '@_',
    allowBooleanAttributes: true,
    parseTagValue:        true,
    cdataPropName:        '__cdata',
    trimValues:           true,
});

// ─── Feed Sources per Category ───────────────────────────────────────────────

const FEEDS = {
    invest: [
        { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',                                                      name: 'CNBC Markets' },
        { url: 'https://feeds.marketwatch.com/marketwatch/topstories/',                                                       name: 'MarketWatch' },
        { url: 'https://feeds.reuters.com/reuters/businessNews',                                                              name: 'Reuters Business' },
        { url: 'https://news.google.com/rss/search?q=investment+stock+market+finance+economy&hl=en&gl=US&ceid=US:en',        name: 'Google News' },
        { url: 'https://news.google.com/rss/search?q=การลงทุน+หุ้น+ตลาดทุน+SET&hl=th&gl=TH&ceid=TH:th',                   name: 'Google News TH' },
    ],
    crypto: [
        { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',                                                            name: 'CoinDesk' },
        { url: 'https://cointelegraph.com/rss',                                                                              name: 'CoinTelegraph' },
        { url: 'https://decrypt.co/feed',                                                                                    name: 'Decrypt' },
        { url: 'https://news.google.com/rss/search?q=cryptocurrency+bitcoin+ethereum+DeFi&hl=en&gl=US&ceid=US:en',          name: 'Google News' },
    ],
    tech: [
        { url: 'https://techcrunch.com/feed/',                                                                               name: 'TechCrunch' },
        { url: 'https://feeds.arstechnica.com/arstechnica/index',                                                            name: 'Ars Technica' },
        { url: 'https://www.theverge.com/rss/index.xml',                                                                     name: 'The Verge' },
        { url: 'https://news.google.com/rss/search?q=technology+AI+artificial+intelligence+innovation&hl=en&gl=US&ceid=US:en', name: 'Google News' },
    ],
    health: [
        { url: 'https://www.who.int/rss-feeds/news-english.xml',                                                             name: 'WHO' },
        { url: 'https://news.google.com/rss/search?q=health+medical+wellness+disease+treatment&hl=en&gl=US&ceid=US:en',     name: 'Google News' },
        { url: 'https://news.google.com/rss/search?q=สุขภาพ+โรค+แพทย์+การรักษา&hl=th&gl=TH&ceid=TH:th',                  name: 'Google News TH' },
    ],
};

const FALLBACKS = {
    invest: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?auto=format&fit=crop&w=800&q=80',
    crypto: 'https://images.unsplash.com/photo-1621504450168-38f684489e05?auto=format&fit=crop&w=800&q=80',
    tech:   'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    health: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim();

function extractImage(item, fallback) {
    // media:content / media:thumbnail
    const mc = item['media:content'];
    if (mc) {
        const url = Array.isArray(mc) ? mc[0]?.['@_url'] : mc?.['@_url'];
        if (url && typeof url === 'string') return url;
    }
    const mt = item['media:thumbnail'];
    if (mt) {
        const url = Array.isArray(mt) ? mt[0]?.['@_url'] : mt?.['@_url'];
        if (url && typeof url === 'string') return url;
    }
    // enclosure (image/*)
    const enc = item.enclosure;
    if (enc?.['@_type']?.startsWith('image') && enc?.['@_url']) return enc['@_url'];
    // first <img> inside content:encoded or description — use extractText to unwrap CDATA
    const html = extractText(item['content:encoded'] || '') || extractText(item.description || '') || extractText(item.content || '');
    const src = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    if (src) return src;
    return fallback;
}

function extractText(field) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (field.__cdata) return field.__cdata;
    if (field['#text']) return field['#text'];
    return String(field);
}

function extractLink(item) {
    if (typeof item.link === 'string') return item.link;
    // Atom: link is an object with @_href
    if (item.link?.['@_href']) return item.link['@_href'];
    // Multiple links (Atom array)
    if (Array.isArray(item.link)) {
        const alt = item.link.find(l => l['@_rel'] === 'alternate' || !l['@_rel']);
        return alt?.['@_href'] || '';
    }
    // GUID as fallback
    return extractText(item.guid) || '';
}

function parseTimestamp(item) {
    const raw = item.pubDate || item.published || item.updated || item['dc:date'] || '';
    const ts = Date.parse(extractText(raw));
    return isNaN(ts) ? Date.now() : ts;
}

function normalizeImg(url) {
    if (!url) return '';
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('http://')) return 'https://' + url.slice(7);
    return url;
}

function toArticle(item, sourceName, fallback) {
    const title = stripHtml(extractText(item.title));
    const url   = extractLink(item);
    if (!title || !url) return null;
    const rawImg = extractImage(item, fallback);
    return {
        id:          url,
        title,
        description: stripHtml(extractText(item.description || item.summary || '')).slice(0, 220),
        url,
        image:       normalizeImg(rawImg) || fallback,
        source:      sourceName,
        publishedAt: parseTimestamp(item),
    };
}

async function fetchFeed({ url, name }, fallback) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BoomTechNewsBot/1.0)',
                'Accept':     'application/rss+xml, application/atom+xml, application/xml, text/xml',
            },
            signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) return [];

        const xml  = await res.text();
        const data = parser.parse(xml);

        // RSS 2.0
        let items = data?.rss?.channel?.item ?? [];
        // Atom
        if (!items.length) items = data?.feed?.entry ?? [];

        if (!Array.isArray(items)) items = [items];

        return items
            .slice(0, 10)
            .map(item => toArticle(item, name, fallback))
            .filter(Boolean);
    } catch {
        return [];
    }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
    const category = req.query?.category ?? 'invest';
    const feeds    = FEEDS[category];

    if (!feeds) return res.status(400).json({ error: 'Invalid category' });

    const fallback = FALLBACKS[category] || '';
    const results  = await Promise.allSettled(feeds.map(f => fetchFeed(f, fallback)));
    const all      = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

    // Sort newest first
    all.sort((a, b) => b.publishedAt - a.publishedAt);

    // Deduplicate by URL
    const seen = new Set();
    const articles = all.filter(a => {
        if (seen.has(a.url)) return false;
        seen.add(a.url);
        return true;
    }).slice(0, 21);

    // Cache 5 min at edge, stale-while-revalidate 10 min
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ articles, fetchedAt: Date.now() });
}
