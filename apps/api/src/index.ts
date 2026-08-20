import { buildApp } from './config/app'
import { config } from './config/env'

async function main() {
  try {
    const fastify = await buildApp()

    await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    })

    console.log(`🚀 Server running at http://localhost:${config.port}`)
    console.log(`📚 API Documentation at http://localhost:${config.port}/docs`)
    console.log(`🏥 Health check at http://localhost:${config.port}/health`)

    // Handle graceful shutdown
    const signals = ['SIGINT', 'SIGTERM']
    signals.forEach((signal) =>
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}, shutting down gracefully...`)
        await fastify.close()
        process.exit(0)
      })
    )
  } catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

main()
