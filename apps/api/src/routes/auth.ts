import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

export default fp(async function (fastify: FastifyInstance) {
  // Login
  fastify.post('/auth/login', async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string }

    if (!username || !password) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Username dan password wajib diisi' 
      })
    }

    const user = await fastify.prisma.user.findUnique({
      where: { username },
    })

    if (!user || !user.isActive) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Username atau password salah' 
      })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Username atau password salah' 
      })
    }

    // Update last login
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    })

    const accessToken = fastify.jwt.sign({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    const refreshToken = fastify.jwt.sign({
      userId: user.id,
      username: user.username,
      role: user.role,
    }, { expiresIn: '7d' })

    return reply.send({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
      accessToken,
      refreshToken,
    })
  })

  // Refresh token
  fastify.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string }

    if (!refreshToken) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Refresh token wajib diisi' 
      })
    }

    try {
      const decoded = fastify.jwt.verify(refreshToken) as any
      
      const user = await fastify.prisma.user.findUnique({
        where: { id: decoded.userId },
      })

      if (!user || !user.isActive) {
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'User tidak ditemukan atau nonaktif' 
        })
      }

      const accessToken = fastify.jwt.sign({
        userId: user.id,
        username: user.username,
        role: user.role,
      })

      return reply.send({ accessToken })
    } catch (err) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Refresh token tidak valid atau kadaluarsa' 
      })
    }
  })

  // Logout
  fastify.post('/auth/logout', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId: request.user?.userId,
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: request.user?.userId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    })

    return reply.send({ success: true, message: 'Logout berhasil' })
  })

  // Get current user
  fastify.get('/auth/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user?.userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    if (!user) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: 'User tidak ditemukan' 
      })
    }

    return reply.send(user)
  })

  // Change password
  fastify.post('/auth/change-password', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body as { 
      currentPassword: string
      newPassword: string 
    }

    if (!currentPassword || !newPassword) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Password saat ini dan password baru wajib diisi' 
      })
    }

    if (newPassword.length < 6) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Password baru minimal 6 karakter' 
      })
    }

    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user?.userId },
    })

    if (!user) {
      return reply.code(404).send({ 
        error: 'Not Found', 
        message: 'User tidak ditemukan' 
      })
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password)
    if (!validPassword) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Password saat ini salah' 
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        mustChangePassword: false,
      },
    })

    return reply.send({ 
      success: true, 
      message: 'Password berhasil diubah' 
    })
  })
})
