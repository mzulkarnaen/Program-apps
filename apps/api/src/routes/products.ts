import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

export default fp(async function (fastify: FastifyInstance) {
  // Get all products with filtering, sorting, pagination
  fastify.get('/products', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const {
      page = '1',
      limit = '20',
      search,
      categoryId,
      lowStock,
      active,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = request.query as Record<string, string>

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (lowStock === 'true') {
      where.stock = { lte: fastify.prisma.product.fields.minStock }
    }

    if (active !== undefined) {
      where.isActive = active === 'true'
    }

    const [products, total] = await Promise.all([
      fastify.prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
      }),
      fastify.prisma.product.count({ where }),
    ])

    return reply.send({
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  })

  // Get product by ID
  fastify.get('/products/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const product = await fastify.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    })

    if (!product) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: 'Produk tidak ditemukan' 
      })
    }

    return reply.send(product)
  })

  // Create product
  fastify.post('/products', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
  }, async (request, reply) => {
    const body = request.body as any

    // Validate required fields
    if (!body.code || !body.name) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Kode dan nama produk wajib diisi' 
      })
    }

    // Check if code already exists
    const existing = await fastify.prisma.product.findUnique({
      where: { code: body.code },
    })

    if (existing) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Kode produk sudah digunakan' 
      })
    }

    // Check barcode uniqueness if provided
    if (body.barcode) {
      const existingBarcode = await fastify.prisma.product.findUnique({
        where: { barcode: body.barcode },
      })

      if (existingBarcode) {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Barcode sudah digunakan' 
        })
      }
    }

    const product = await fastify.prisma.product.create({
      data: {
        code: body.code,
        barcode: body.barcode || '',
        name: body.name,
        categoryId: body.categoryId,
        brand: body.brand || '',
        unit: body.unit || 'PCS',
        description: body.description || '',
        buyPrice: parseInt(body.buyPrice) || 0,
        sellPrice: parseInt(body.sellPrice) || 0,
        stock: parseInt(body.stock) || 0,
        minStock: parseInt(body.minStock) || 5,
        location: body.location || '',
        isActive: body.isActive !== false,
      },
      include: { category: true },
    })

    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.userId,
        action: 'CREATE',
        entityType: 'PRODUCT',
        entityId: product.id,
        newValue: JSON.stringify(product),
      },
    })

    return reply.code(201).send(product)
  })

  // Update product
  fastify.put('/products/:id', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = request.body as any

    const existing = await fastify.prisma.product.findUnique({
      where: { id },
    })

    if (!existing) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: 'Produk tidak ditemukan' 
      })
    }

    // Check code uniqueness if changed
    if (body.code && body.code !== existing.code) {
      const codeExists = await fastify.prisma.product.findUnique({
        where: { code: body.code },
      })

      if (codeExists) {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Kode produk sudah digunakan' 
        })
      }
    }

    // Check barcode uniqueness if changed
    if (body.barcode && body.barcode !== existing.barcode) {
      const barcodeExists = await fastify.prisma.product.findUnique({
        where: { barcode: body.barcode },
      })

      if (barcodeExists) {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Barcode sudah digunakan' 
        })
      }
    }

    const product = await fastify.prisma.product.update({
      where: { id },
      data: {
        code: body.code,
        barcode: body.barcode,
        name: body.name,
        categoryId: body.categoryId,
        brand: body.brand,
        unit: body.unit,
        description: body.description,
        buyPrice: parseInt(body.buyPrice),
        sellPrice: parseInt(body.sellPrice),
        minStock: parseInt(body.minStock),
        location: body.location,
        isActive: body.isActive,
      },
      include: { category: true },
    })

    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.userId,
        action: 'UPDATE',
        entityType: 'PRODUCT',
        entityId: product.id,
        oldValue: JSON.stringify(existing),
        newValue: JSON.stringify(product),
      },
    })

    return reply.send(product)
  })

  // Delete product (soft delete)
  fastify.delete('/products/:id', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const existing = await fastify.prisma.product.findUnique({
      where: { id },
    })

    if (!existing) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: 'Produk tidak ditemukan' 
      })
    }

    // Soft delete by setting isActive to false
    const product = await fastify.prisma.product.update({
      where: { id },
      data: { isActive: false },
    })

    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.userId,
        action: 'DELETE',
        entityType: 'PRODUCT',
        entityId: product.id,
        oldValue: JSON.stringify(existing),
        newValue: JSON.stringify({ isActive: false }),
      },
    })

    return reply.send({ success: true, message: 'Produk berhasil dihapus' })
  })

  // Adjust stock
  fastify.post('/products/:id/adjust-stock', {
    preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { type, quantity, notes } = request.body as { 
      type: string
      quantity: number
      notes?: string 
    }

    const product = await fastify.prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: 'Produk tidak ditemukan' 
      })
    }

    const newStock = product.stock + quantity

    if (newStock < 0) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Stok tidak boleh negatif' 
      })
    }

    // Use transaction to ensure atomicity
    const result = await fastify.prisma.$transaction(async (tx) => {
      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { stock: newStock },
      })

      // Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          productId: id,
          type,
          quantity,
          previousStock: product.stock,
          newStock,
          referenceType: 'ADJUSTMENT',
          notes,
          userId: request.user!.userId,
        },
      })

      return { product: updatedProduct, movement }
    })

    return reply.send(result.product)
  })
})
