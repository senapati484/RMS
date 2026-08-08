import { Router, Request, Response } from 'express'
import { Attribute } from '../models/Attribute'
import { AuthRequest, requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

// GET /api/attributes — Fetch attributes list
router.get('/', async (req: Request, res: Response) => {
  try {
    const attributes = await Attribute.find({}).sort({ createdAt: -1 }).lean()
    return res.json({ attributes })
  } catch (err) {
    console.error('[EXPRESS GET ATTRIBUTES ERROR]', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/attributes — Create or update attribute (Admin only)
router.post('/', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { _id, name, values } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Attribute name is required' })
    }

    let attribute
    if (_id) {
      attribute = await Attribute.findByIdAndUpdate(_id, { name, values }, { new: true })
    } else {
      attribute = await Attribute.create({ name, values })
    }

    return res.status(201).json(attribute)
  } catch (err) {
    console.error('[EXPRESS POST ATTRIBUTE ERROR]', err)
    return res.status(400).json({ error: 'Failed to save attribute' })
  }
})

export default router
