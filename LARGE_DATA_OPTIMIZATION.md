# Large Data Optimization Guide

This document outlines the optimizations implemented to handle large datasets in the Odoo rental platform.

## Overview

The codebase has been enhanced with several performance optimizations to handle large datasets efficiently:

1. **Cursor-based Pagination** - Alternative to traditional offset-based pagination
2. **Optimized Database Indexes** - Strategic indexing for common query patterns
3. **Bulk Operations** - Efficient data import/export capabilities
4. **Caching Strategy** - In-memory caching for frequently accessed data
5. **Connection Pooling** - Enhanced MongoDB connection management
6. **Data Archiving** - Automated archiving of old records

## 1. Cursor-based Pagination

### Implementation
- **File**: `src/lib/pagination.ts`
- **Usage**: Products and Orders API routes support cursor-based pagination

### How to Use
```typescript
// Use cursor-based pagination by adding `cursor` parameter
GET /api/products?cursor=true&limit=50

// Response includes nextCursor for pagination
{
  "products": [...],
  "nextCursor": "base64encodedcursor",
  "hasMore": true,
  "paginationType": "cursor"
}
```

### Benefits
- More efficient than skip/limit for large collections
- No performance degradation with deep pagination
- Consistent results even if data changes between requests

## 2. Optimized Database Indexes

### Implementation
- **Files**: All model files (Product.ts, Order.ts, User.ts, etc.)
- **Changes**: Added compound indexes with descriptive names

### Key Indexes Added

**Products:**
- `published_created_idx` - For filtering published products by creation date
- `stock_created_idx` - For sorting by stock availability
- `type_published_idx` - For filtering by product type
- `category_published_idx` - For filtering by category

**Orders:**
- `user_created_idx` - For user order history
- `status_created_idx` - For filtering by status
- `status_rental_created_idx` - For rental period queries

**Users:**
- `email_unique_idx` - Unique email constraint
- `role_verification_idx` - For filtering verified users
- `location_idx` - For geographic queries

### Index Management
```bash
# To rebuild indexes after deployment
# The indexes will be automatically created when the application starts
```

## 3. Bulk Operations

### Implementation
- **Files**: 
  - `src/lib/pagination.ts` - Bulk insert/update functions
  - `src/app/api/products/bulk/route.ts` - Bulk API endpoint
  - `src/app/api/products/export/route.ts` - Export functionality
  - `scripts/seed-bulk.ts` - Optimized bulk seeding script

### Bulk Insert API
```typescript
POST /api/products/bulk
{
  "operation": "insert",
  "data": [
    { "name": "Product 1", "sku": "SKU001", ... },
    { "name": "Product 2", "sku": "SKU002", ... }
  ]
}
```

### Bulk Update API
```typescript
POST /api/products/bulk
{
  "operation": "update",
  "data": [
    { "_id": "...", "dailyRate": 1000 },
    { "_id": "...", "availableStock": 5 }
  ]
}
```

### Export API
```typescript
GET /api/products/export?format=csv&limit=1000
GET /api/products/export?format=json&limit=5000
```

### Benefits
- Chunked processing (1000 records per batch)
- Error handling with partial success
- Memory efficient for large datasets

## 4. Caching Strategy

### Implementation
- **File**: `src/lib/cache.ts`
- **Type**: In-memory cache with TTL support
- **Usage**: Products API and Dashboard API

### Cache Configuration
```typescript
// TTL Options
CacheTTL.SHORT    // 1 minute
CacheTTL.MEDIUM   // 5 minutes  
CacheTTL.LONG     // 15 minutes
CacheTTL.VERY_LONG // 1 hour
```

### Cache Keys
```typescript
// Predefined cache key patterns
CacheKeys.product(id)
CacheKeys.products(params)
CacheKeys.productCount(filter)
CacheKeys.order(id)
CacheKeys.userOrders(userId, params)
CacheKeys.dashboard(userId)
```

### Cache Invalidation
```typescript
// Invalidate by pattern
cache.invalidatePattern('products:list:*')

// Clear all cache
cache.clear()

// Delete specific key
cache.delete('product:123')
```

### Benefits
- Reduced database load for frequently accessed data
- Automatic expiration to prevent stale data
- Pattern-based invalidation for bulk updates

## 5. Connection Pooling

### Implementation
- **File**: `src/lib/db.ts`
- **Changes**: Increased pool sizes and added connection monitoring

### Configuration
```typescript
{
  maxPoolSize: 100,      // Increased from 50
  minPoolSize: 10,       // Increased from 5
  maxIdleTimeMS: 30000,  // Close idle connections
  retryWrites: true,     // Enable retry logic
  retryReads: true,      // Enable retry logic
}
```

### Benefits
- Handles more concurrent connections
- Automatic connection cleanup
- Improved reliability with retry logic

## 6. Data Archiving

### Implementation
- **Files**: 
  - `src/lib/archiver.ts` - Archiving functions
  - `src/app/api/admin/archive/route.ts` - Admin API

### Archive API
```typescript
// Get archive statistics
GET /api/admin/archive

// Run archiving (dry run)
POST /api/admin/archive
{
  "cutoffMonths": 6,
  "dryRun": true
}

// Run actual archiving
POST /api/admin/archive
{
  "cutoffMonths": 6,
  "dryRun": false
}
```

### What Gets Archived
- **Orders**: Completed orders older than cutoff date
- **Quotations**: Rejected/expired quotations older than cutoff date
- **Maintenance Tickets**: Closed tickets older than cutoff date
- **Notifications**: Read notifications older than cutoff date

### Benefits
- Keeps active collections small and fast
- Historical data preserved in archive collections
- Batch processing for efficiency

## Performance Monitoring

### Cache Statistics
```typescript
const stats = cache.getStats()
console.log(`Cache size: ${stats.size}`)
console.log(`Cache keys: ${stats.keys}`)
```

### Archive Statistics
```typescript
const stats = await getArchiveStats()
console.log(`Active orders: ${stats.activeOrders}`)
console.log(`Archived orders: ${stats.archivedOrders}`)
```

## Best Practices

### 1. Use Cursor Pagination for Large Datasets
```typescript
// Good for large datasets
GET /api/products?cursor=true&limit=100

// Good for small datasets or when total count needed
GET /api/products?page=1&limit=20
```

### 2. Implement Cache Invalidation
```typescript
// After creating/updating products
cache.invalidatePattern('products:list:*')
cache.invalidatePattern('products:search:*')
```

### 3. Use Bulk Operations for Imports
```typescript
// Instead of individual inserts
for (const product of products) {
  await Product.create(product)
}

// Use bulk insert
await bulkInsert(Product, products, 1000)
```

### 4. Monitor Index Usage
```bash
# In MongoDB shell
db.products.getIndexes()
db.products.stats()
```

### 5. Regular Archiving
```typescript
// Schedule regular archiving (e.g., monthly)
// POST /api/admin/archive with cutoffMonths=6
```

## Migration Guide

### Existing Code Updates
No breaking changes to existing APIs. All optimizations are backward compatible:

1. **Pagination**: Existing offset-based pagination still works
2. **Caching**: Automatic cache hits when available
3. **Indexes**: Automatically created on application start

### New Features Available
1. **Cursor pagination**: Add `cursor=true` to use
2. **Bulk operations**: New API endpoints available
3. **Export functionality**: New export endpoint
4. **Archiving**: New admin archive endpoint

## Troubleshooting

### High Memory Usage
- Reduce cache TTL values
- Lower connection pool sizes
- Implement more aggressive archiving

### Slow Queries
- Check index usage with MongoDB explain()
- Ensure compound indexes match query patterns
- Consider cursor-based pagination

### Cache Issues
- Monitor cache statistics regularly
- Implement proper invalidation strategies
- Consider Redis for distributed caching

## Performance Benchmarks

### Expected Improvements
- **Pagination**: 10x faster for deep pagination (page 1000+)
- **Bulk Inserts**: 5x faster for 1000+ records
- **Dashboard Queries**: 3x faster with caching
- **Overall DB Load**: 40% reduction with caching

### Monitoring
- Track response times for key endpoints
- Monitor database query performance
- Watch cache hit rates
- Monitor connection pool usage

## Future Enhancements

1. **Redis Integration**: Replace in-memory cache with Redis
2. **Read Replicas**: Distribute read operations
3. **Sharding**: Horizontal scaling for very large datasets
4. **Query Optimization**: Advanced query analysis and optimization
5. **Automated Archiving**: Scheduled archiving jobs

---

## Summary

These optimizations provide a comprehensive approach to handling large datasets in the Odoo rental platform. The implementation maintains backward compatibility while adding powerful new features for improved performance and scalability.

For questions or issues, refer to the individual implementation files or contact the development team.