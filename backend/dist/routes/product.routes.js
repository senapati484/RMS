"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Product_1 = require("../models/Product");
const router = (0, express_1.Router)();
// GET /api/products — Scalable paginated product catalog query
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10')));
        const productType = req.query.productType;
        const category = req.query.category;
        const q = req.query.q;
        const showAll = req.query.showAll === '1' && (req.user?.role === 'ADMIN' || req.user?.role === 'STAFF');
        const sortBy = req.query.sortBy;
        const inStockOnly = req.query.inStockOnly === 'true' || req.query.inStockOnly === '1';
        const brand = req.query.brand;
        const filter = {};
        if (!showAll) {
            filter.isPublished = { $ne: false };
            filter.isArchived = { $ne: true };
        }
        if (category && category !== 'All' && category !== 'all') {
            filter.category = category;
        }
        if (productType && productType !== 'all') {
            filter.productType = productType;
        }
        if (inStockOnly) {
            filter.availableStock = { $gt: 0 };
        }
        if (brand && brand !== 'ALL' && brand !== 'all') {
            filter.brand = brand;
        }
        if (q && q.trim()) {
            const sanitized = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim();
            filter.$or = [
                { name: { $regex: sanitized, $options: 'i' } },
                { description: { $regex: sanitized, $options: 'i' } },
                { tags: { $regex: sanitized, $options: 'i' } },
                { brand: { $regex: sanitized, $options: 'i' } },
                { sku: { $regex: sanitized, $options: 'i' } },
            ];
        }
        let sortOption = { isPublished: -1, createdAt: -1 };
        if (sortBy === 'PRICE_LOW')
            sortOption = { dailyRate: 1 };
        else if (sortBy === 'PRICE_HIGH')
            sortOption = { dailyRate: -1 };
        else if (sortBy === 'AVAILABILITY')
            sortOption = { availableStock: -1 };
        const fields = 'name slug description imageUrl productType category brand sku condition totalStock availableStock dailyRate weeklyRate monthlyRate baseDepositAmt isPublished isArchived tags';
        const brandQueryFilter = { isPublished: { $ne: false }, isArchived: { $ne: true } };
        if (productType && productType !== 'all')
            brandQueryFilter.productType = productType;
        const [products, total, distinctBrands] = await Promise.all([
            Product_1.Product.find(filter)
                .select(fields)
                .sort(sortOption)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Product_1.Product.countDocuments(filter),
            Product_1.Product.distinct('brand', brandQueryFilter),
        ]);
        const pages = Math.ceil(total / limit) || 1;
        const hasMore = page < pages;
        const brands = distinctBrands.filter(Boolean).sort();
        res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59');
        return res.json({
            products,
            total,
            page,
            limit,
            pages,
            hasMore,
            brands,
        });
    }
    catch (err) {
        console.error('[EXPRESS GET PRODUCTS ERROR]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/products/:id — Single product details
router.get('/:id', async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id).lean();
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        return res.json(product);
    }
    catch (err) {
        console.error('[EXPRESS GET PRODUCT BY ID ERROR]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
