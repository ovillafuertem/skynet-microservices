"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRedisConnection = buildRedisConnection;
function buildRedisConnection(config) {
    const url = config.get('REDIS_URL');
    if (url)
        return { url };
    const host = config.get('REDIS_HOST', 'localhost');
    const port = parseInt(config.get('REDIS_PORT') ?? '6379', 10);
    const username = config.get('REDIS_USERNAME');
    const password = config.get('REDIS_PASSWORD');
    return {
        host,
        port,
        ...(username ? { username } : {}),
        ...(password ? { password } : {}),
    };
}
//# sourceMappingURL=redis.utils.js.map