class FastCache {
    constructor() {
        this.cache = new Map();
        this.ttl = new Map();
        this.maxSize = 100; // Limit cache size
        
        // Cleanup expired entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    set(key, value, ttlMs = 60000) { // 1 minute default TTL
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
            this.ttl.delete(firstKey);
        }

        this.cache.set(key, value);
        this.ttl.set(key, Date.now() + ttlMs);
    }

    get(key) {
        const expiry = this.ttl.get(key);
        if (!expiry || Date.now() > expiry) {
            this.cache.delete(key);
            this.ttl.delete(key);
            return null;
        }
        return this.cache.get(key);
    }

    cleanup() {
        const now = Date.now();
        for (const [key, expiry] of this.ttl.entries()) {
            if (now > expiry) {
                this.cache.delete(key);
                this.ttl.delete(key);
            }
        }
    }

    clear() {
        this.cache.clear();
        this.ttl.clear();
    }
}

const fastCache = new FastCache();

// Lightning-fast cache middleware
const ultraFastCache = (ttlMs = 60000) => (req, res, next) => {
    if (req.method !== 'GET') return next();
    
    const key = `${req.originalUrl}:${req.method}`;
    const cached = fastCache.get(key);
    
    if (cached) {
        return res.status(200).json(cached);
    }
    
    const originalJson = res.json;
    res.json = function(data) {
        if (res.statusCode === 200) {
            fastCache.set(key, data, ttlMs);
        }
        return originalJson.call(this, data);
    };
    
    next();
};

export default ultraFastCache;