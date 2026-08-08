"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProductSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    description: { type: String },
    imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400' },
    productType: {
        type: String,
        enum: ['camera', 'lens', 'audio', 'lighting', 'monitor', 'vehicle', 'support', 'furniture', 'event', 'other'],
        default: 'other',
    },
    itemKind: {
        type: String,
        enum: ['GOODS', 'SERVICE'],
        default: 'GOODS',
    },
    category: { type: String, required: true, default: 'Electronics' },
    brand: { type: String, trim: true },
    sku: { type: String, required: true, trim: true },
    condition: {
        type: String,
        enum: ['NEW', 'EXCELLENT', 'GOOD', 'FAIR'],
        default: 'EXCELLENT',
    },
    totalStock: { type: Number, default: 1, min: 0 },
    availableStock: { type: Number, default: 1, min: 0 },
    dailyRate: { type: Number, default: 50, min: 0 },
    weeklyRate: { type: Number },
    monthlyRate: { type: Number },
    costPrice: { type: Number },
    salesPrice: { type: Number },
    baseDepositAmt: { type: Number, default: 200, min: 0 },
    depositIsPercent: { type: Boolean, default: false },
    accessoryList: [{ type: String }],
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
}, { timestamps: true });
ProductSchema.index({ isPublished: 1, isArchived: 1, productType: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ dailyRate: 1 });
ProductSchema.index({ availableStock: 1 });
exports.Product = mongoose_1.default.models.Product || mongoose_1.default.model('Product', ProductSchema);
