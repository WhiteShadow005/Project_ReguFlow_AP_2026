/**
 * Request Logger Middleware for Phenix / Project ReguFlow
 * Logs incoming HTTP method, URL path, timestamp, and response duration.
 */
export function requestLogger(req, res, next = () => {}) {
    const startTime = process.hrtime();
    const timestamp = new Date().toISOString();

    // Listen for response finish to calculate duration
    res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);

        console.log(`[${timestamp}] ${req.method} ${req.url} -> ${res.statusCode} (${durationMs}ms)`);
    });

    if (typeof next === 'function') {
        next();
    }
}
