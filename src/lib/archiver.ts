import mongoose from 'mongoose'

/**
 * Data archiving utility for managing large datasets
 * Moves old/completed records to archive collections to improve performance
 */

export interface ArchiveOptions {
  cutoffDate: Date
  dryRun?: boolean
  batchSize?: number
}

export interface ArchiveResult {
  archived: number
  skipped: number
  errors: number
  duration: number
}

/**
 * Archive old orders that are completed and older than cutoff date
 */
export async function archiveOldOrders(
  options: ArchiveOptions
): Promise<ArchiveResult> {
  const startTime = Date.now()
  const { cutoffDate, dryRun = false, batchSize = 1000 } = options

  const Order = mongoose.model('Order')
  const ArchivedOrder = mongoose.models.ArchivedOrder || 
    mongoose.model('ArchivedOrder', new mongoose.Schema({}, { strict: false }))

  // Find orders to archive (completed statuses and older than cutoff)
  const completedStatuses = ['RETURNED_ON_TIME', 'RETURNED_LATE', 'CANCELLED']
  const query = {
    status: { $in: completedStatuses },
    updatedAt: { $lt: cutoffDate },
  }

  const totalToArchive = await Order.countDocuments(query)
  console.log(`Found ${totalToArchive} orders to archive`)

  let archived = 0
  let skipped = 0
  let errors = 0

  // Process in batches
  let hasMore = true
  let skip = 0

  while (hasMore) {
    try {
      const orders = await Order.find(query)
        .skip(skip)
        .limit(batchSize)
        .lean()

      if (orders.length === 0) {
        hasMore = false
        break
      }

      if (!dryRun) {
        // Insert into archive collection
        await ArchivedOrder.insertMany(orders, { ordered: false })
        
        // Delete from main collection
        const orderIds = orders.map((o: any) => o._id)
        await Order.deleteMany({ _id: { $in: orderIds } })
      }

      archived += orders.length
      skip += batchSize
      console.log(`Archived ${archived}/${totalToArchive} orders...`)

    } catch (error) {
      console.error('Error archiving batch:', error)
      errors += batchSize
      skip += batchSize
    }
  }

  const duration = Date.now() - startTime

  return {
    archived,
    skipped,
    errors,
    duration,
  }
}

/**
 * Archive old quotations that are rejected/expired and older than cutoff date
 */
export async function archiveOldQuotations(
  options: ArchiveOptions
): Promise<ArchiveResult> {
  const startTime = Date.now()
  const { cutoffDate, dryRun = false, batchSize = 1000 } = options

  const Quotation = mongoose.model('Quotation')
  const ArchivedQuotation = mongoose.models.ArchivedQuotation || 
    mongoose.model('ArchivedQuotation', new mongoose.Schema({}, { strict: false }))

  const query = {
    status: { $in: ['REJECTED', 'EXPIRED'] },
    updatedAt: { $lt: cutoffDate },
  }

  const totalToArchive = await Quotation.countDocuments(query)
  console.log(`Found ${totalToArchive} quotations to archive`)

  let archived = 0
  let skipped = 0
  let errors = 0

  let hasMore = true
  let skip = 0

  while (hasMore) {
    try {
      const quotations = await Quotation.find(query)
        .skip(skip)
        .limit(batchSize)
        .lean()

      if (quotations.length === 0) {
        hasMore = false
        break
      }

      if (!dryRun) {
        await ArchivedQuotation.insertMany(quotations, { ordered: false })
        const quotationIds = quotations.map((q: any) => q._id)
        await Quotation.deleteMany({ _id: { $in: quotationIds } })
      }

      archived += quotations.length
      skip += batchSize
      console.log(`Archived ${archived}/${totalToArchive} quotations...`)

    } catch (error) {
      console.error('Error archiving batch:', error)
      errors += batchSize
      skip += batchSize
    }
  }

  const duration = Date.now() - startTime

  return {
    archived,
    skipped,
    errors,
    duration,
  }
}

/**
 * Archive old maintenance tickets that are closed and older than cutoff date
 */
export async function archiveOldMaintenanceTickets(
  options: ArchiveOptions
): Promise<ArchiveResult> {
  const startTime = Date.now()
  const { cutoffDate, dryRun = false, batchSize = 1000 } = options

  const MaintenanceTicket = mongoose.model('MaintenanceTicket')
  const ArchivedMaintenanceTicket = mongoose.models.ArchivedMaintenanceTicket || 
    mongoose.model('ArchivedMaintenanceTicket', new mongoose.Schema({}, { strict: false }))

  const query = {
    status: 'CLOSED',
    updatedAt: { $lt: cutoffDate },
  }

  const totalToArchive = await MaintenanceTicket.countDocuments(query)
  console.log(`Found ${totalToArchive} maintenance tickets to archive`)

  let archived = 0
  let skipped = 0
  let errors = 0

  let hasMore = true
  let skip = 0

  while (hasMore) {
    try {
      const tickets = await MaintenanceTicket.find(query)
        .skip(skip)
        .limit(batchSize)
        .lean()

      if (tickets.length === 0) {
        hasMore = false
        break
      }

      if (!dryRun) {
        await ArchivedMaintenanceTicket.insertMany(tickets, { ordered: false })
        const ticketIds = tickets.map((t: any) => t._id)
        await MaintenanceTicket.deleteMany({ _id: { $in: ticketIds } })
      }

      archived += tickets.length
      skip += batchSize
      console.log(`Archived ${archived}/${totalToArchive} maintenance tickets...`)

    } catch (error) {
      console.error('Error archiving batch:', error)
      errors += batchSize
      skip += batchSize
    }
  }

  const duration = Date.now() - startTime

  return {
    archived,
    skipped,
    errors,
    duration,
  }
}

/**
 * Archive old notifications that are read and older than cutoff date
 */
export async function archiveOldNotifications(
  options: ArchiveOptions
): Promise<ArchiveResult> {
  const startTime = Date.now()
  const { cutoffDate, dryRun = false, batchSize = 1000 } = options

  const Notification = mongoose.model('Notification')
  const ArchivedNotification = mongoose.models.ArchivedNotification || 
    mongoose.model('ArchivedNotification', new mongoose.Schema({}, { strict: false }))

  const query = {
    isRead: true,
    createdAt: { $lt: cutoffDate },
  }

  const totalToArchive = await Notification.countDocuments(query)
  console.log(`Found ${totalToArchive} notifications to archive`)

  let archived = 0
  let skipped = 0
  let errors = 0

  let hasMore = true
  let skip = 0

  while (hasMore) {
    try {
      const notifications = await Notification.find(query)
        .skip(skip)
        .limit(batchSize)
        .lean()

      if (notifications.length === 0) {
        hasMore = false
        break
      }

      if (!dryRun) {
        await ArchivedNotification.insertMany(notifications, { ordered: false })
        const notificationIds = notifications.map((n: any) => n._id)
        await Notification.deleteMany({ _id: { $in: notificationIds } })
      }

      archived += notifications.length
      skip += batchSize
      console.log(`Archived ${archived}/${totalToArchive} notifications...`)

    } catch (error) {
      console.error('Error archiving batch:', error)
      errors += batchSize
      skip += batchSize
    }
  }

  const duration = Date.now() - startTime

  return {
    archived,
    skipped,
    errors,
    duration,
  }
}

/**
 * Run all archiving operations
 */
export async function runAllArchiving(
  cutoffDate: Date,
  dryRun = false
): Promise<{ orders: ArchiveResult; quotations: ArchiveResult; tickets: ArchiveResult; notifications: ArchiveResult }> {
  console.log('Starting data archiving process...')
  console.log(`Cutoff date: ${cutoffDate.toISOString()}`)
  console.log(`Dry run: ${dryRun}`)

  const [orders, quotations, tickets, notifications] = await Promise.all([
    archiveOldOrders({ cutoffDate, dryRun }),
    archiveOldQuotations({ cutoffDate, dryRun }),
    archiveOldMaintenanceTickets({ cutoffDate, dryRun }),
    archiveOldNotifications({ cutoffDate, dryRun }),
  ])

  console.log('\nArchiving completed:')
  console.log(`Orders: ${orders.archived} archived, ${orders.errors} errors`)
  console.log(`Quotations: ${quotations.archived} archived, ${quotations.errors} errors`)
  console.log(`Maintenance Tickets: ${tickets.archived} archived, ${tickets.errors} errors`)
  console.log(`Notifications: ${notifications.archived} archived, ${notifications.errors} errors`)

  return { orders, quotations, tickets, notifications }
}

/**
 * Get archive statistics
 */
export async function getArchiveStats(): Promise<{
  activeOrders: number
  archivedOrders: number
  activeQuotations: number
  archivedQuotations: number
  activeTickets: number
  archivedTickets: number
  activeNotifications: number
  archivedNotifications: number
}> {
  const Order = mongoose.model('Order')
  const Quotation = mongoose.model('Quotation')
  const MaintenanceTicket = mongoose.model('MaintenanceTicket')
  const Notification = mongoose.model('Notification')

  const [
    activeOrders,
    archivedOrders,
    activeQuotations,
    archivedQuotations,
    activeTickets,
    archivedTickets,
    activeNotifications,
    archivedNotifications,
  ] = await Promise.all([
    Order.countDocuments(),
    mongoose.models.ArchivedOrder?.countDocuments() || Promise.resolve(0),
    Quotation.countDocuments(),
    mongoose.models.ArchivedQuotation?.countDocuments() || Promise.resolve(0),
    MaintenanceTicket.countDocuments(),
    mongoose.models.ArchivedMaintenanceTicket?.countDocuments() || Promise.resolve(0),
    Notification.countDocuments(),
    mongoose.models.ArchivedNotification?.countDocuments() || Promise.resolve(0),
  ])

  return {
    activeOrders,
    archivedOrders,
    activeQuotations,
    archivedQuotations,
    activeTickets,
    archivedTickets,
    activeNotifications,
    archivedNotifications,
  }
}