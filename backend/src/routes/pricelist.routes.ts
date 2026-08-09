import { Router, Response } from 'express'
import { Pricelist } from '../models/Pricelist'
import { AuthRequest, requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

// GET /api/pricelists
router.get('/', async (req, res: Response) => {
  try {
    const pricelists = await Pricelist.find({}).sort({ createdAt: -1 }).lean()
    return res.json({ pricelists })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch pricelists' })
  }
})

// POST /api/pricelists
router.post('/', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body
    if (!body.name) {
      return res.status(400).json({ error: 'Pricelist name is required' })
    }

    let pricelist
    if (body._id) {
      pricelist = await Pricelist.findByIdAndUpdate(body._id, body, { new: true })
    } else {
      pricelist = await Pricelist.create(body)
    }

    return res.status(201).json(pricelist)
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to save pricelist' })
  }
})

export default router
