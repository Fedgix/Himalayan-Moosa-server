
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; 

const cacheMiddleware = (duration = CACHE_TTL) => (req, res, next) => {
  if (req.method !== 'GET') return next();
  
  const key = req.originalUrl;
  const cached = cache.get(key);
  
  if (cached && (Date.now() - cached.timestamp) < duration) {
    return res.json(cached.data);
  }
  
  const originalJson = res.json;
  res.json = function(data) {
    cache.set(key, { data, timestamp: Date.now() });
    return originalJson.call(this, data);
  };
  
  next();
};

export default cacheMiddleware
