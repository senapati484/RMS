"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jose_1 = require("jose");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env.local') });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'lease360-enterprise-jwt-secret-key-2026-production';
const secret = new TextEncoder().encode(JWT_SECRET);
async function authMiddleware(req, res, next) {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }
    else if (req.cookies && req.cookies['auth-token']) {
        token = req.cookies['auth-token'];
    }
    if (!token) {
        return next();
    }
    try {
        const { payload } = await (0, jose_1.jwtVerify)(token, secret);
        req.user = payload;
    }
    catch {
        // Invalid token — leave req.user undefined
    }
    next();
}
function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}
function requireAdmin(req, res, next) {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
}
