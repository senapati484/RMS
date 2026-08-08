"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./db");
const auth_1 = require("./middleware/auth");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env.local') });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const app = (0, express_1.default)();
const PORT = process.env.EXPRESS_PORT || 5001;
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(auth_1.authMiddleware);
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/orders', order_routes_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Lease360 Standalone Express API Server',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
    });
});
// Start server
(0, db_1.connectDB)()
    .then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 [Express Backend] Server running on http://localhost:${PORT}`);
        console.log(`⚡ [Express Backend] Health Check: http://localhost:${PORT}/api/health`);
    });
})
    .catch((err) => {
    console.error('❌ [Express Backend] Database connection failed:', err);
    process.exit(1);
});
