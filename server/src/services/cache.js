import NodeCache from 'node-cache';

// Initialize cache with a default TTL of 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * Middleware to cache API responses.
 * @param {number} ttl - Time to live in seconds.
 */
export const cacheMiddleware = (ttl) => (req, res, next) => {
    // Only cache GET and POST requests that have a body/params
    if (req.method !== 'GET' && req.method !== 'POST') {
        return next();
    }

    const key = `__cache__${req.originalUrl || req.url}_${JSON.stringify(req.body)}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        console.log(`⚡ Cache hit for: ${key}`);
        return res.json(cachedResponse);
    } else {
        console.log(`🐢 Cache miss for: ${key}`);
        res.originalJson = res.json;
        res.json = (body) => {
            cache.set(key, body, ttl);
            res.originalJson(body);
        };
        next();
    }
};

export default cache;
