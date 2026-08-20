import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      fullName: 'Administrator',
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
    },
  })

  // Create cashier user
  const cashier = await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: {
      username: 'kasir',
      password: hashedPassword,
      fullName: 'Kasir Demo',
      role: 'KASIR',
      isActive: true,
      mustChangePassword: false,
    },
  })

  // Create technician user
  const technician = await prisma.user.upsert({
    where: { username: 'teknisi' },
    update: {},
    create: {
      username: 'teknisi',
      password: hashedPassword,
      fullName: 'Teknisi Demo',
      role: 'TEKNISI',
      isActive: true,
      mustChangePassword: false,
    },
  })

  console.log('✅ Users created:', {
    admin: admin.username,
    cashier: cashier.username,
    technician: technician.username,
  })

  // Create sample categories
  const categories = [
    { name: 'Komponen Elektronik', description: 'Resistor, kapasitor, transistor, dll' },
    { name: 'Sparepart TV', description: 'Sparepart untuk televisi' },
    { name: 'Sparepart Audio', description: 'Sparepart untuk audio system' },
    { name: 'Aksesoris', description: 'Kabel, konektor, dll' },
    { name: 'Jasa Service', description: 'Jasa perbaikan elektronik' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }

  console.log('✅ Categories created')

  // Create sample products
  const categoryMap = await prisma.category.findMany()
  const komponenCat = categoryMap.find(c => c.name === 'Komponen Elektronik')
  const tvCat = categoryMap.find(c => c.name === 'Sparepart TV')
  const jasaCat = categoryMap.find(c => c.name === 'Jasa Service')

  const products = [
    {
      code: 'PROD-001',
      barcode: '8991234567890',
      name: 'Resistor 1K Ohm',
      categoryId: komponenCat?.id,
      brand: 'Generic',
      unit: 'PCS',
      buyPrice: 100,
      sellPrice: 500,
      stock: 100,
      minStock: 20,
    },
    {
      code: 'PROD-002',
      barcode: '8991234567891',
      name: 'Kapasitor 100uF 25V',
      categoryId: komponenCat?.id,
      brand: 'Generic',
      unit: 'PCS',
      buyPrice: 500,
      sellPrice: 1500,
      stock: 50,
      minStock: 10,
    },
    {
      code: 'PROD-003',
      barcode: '',
      name: 'Remote Control Universal TV',
      categoryId: tvCat?.id,
      brand: 'Samsung',
      unit: 'PCS',
      buyPrice: 25000,
      sellPrice: 45000,
      stock: 20,
      minStock: 5,
    },
    {
      code: 'PROD-004',
      barcode: '',
      name: 'LED Backlight 32 inch',
      categoryId: tvCat?.id,
      brand: 'Generic',
      unit: 'SET',
      buyPrice: 85000,
      sellPrice: 150000,
      stock: 10,
      minStock: 3,
    },
    {
      code: 'SRV-001',
      barcode: '',
      name: 'Service TV LED 32 inch',
      categoryId: jasaCat?.id,
      brand: '',
      unit: 'UNIT',
      buyPrice: 0,
      sellPrice: 150000,
      stock: 0,
      minStock: 0,
    },
    {
      code: 'SRV-002',
      barcode: '',
      name: 'Service Audio Amplifier',
      categoryId: jasaCat?.id,
      brand: '',
      unit: 'UNIT',
      buyPrice: 0,
      sellPrice: 100000,
      stock: 0,
      minStock: 0,
    },
  ]

  for (const prod of products) {
    await prisma.product.upsert({
      where: { code: prod.code },
      update: prod,
      create: prod,
    })
  }

  console.log('✅ Products created')

  // Create sample technicians
  const technicians = [
    { name: 'Budi Santoso', phone: '081234567890', specialty: 'TV & Monitor' },
    { name: 'Ahmad Hidayat', phone: '081234567891', specialty: 'Audio System' },
  ]

  for (const tech of technicians) {
    await prisma.technician.upsert({
      where: { name: tech.name },
      update: {},
      create: tech,
    })
  }

  console.log('✅ Technicians created')

  // Create default settings
  const settings = [
    {
      key: 'store_profile',
      value: JSON.stringify({
        name: 'Elektronik Service POS',
        address: 'Alamat toko Anda',
        phone: '081234567890',
        email: 'info@elektronikservice.com',
        logo: null,
        npwp: '',
      }),
      description: 'Profil toko',
    },
    {
      key: 'tax_settings',
      value: JSON.stringify({
        enabled: false,
        name: 'PPN',
        rate: 11,
        priceIncludesTax: false,
      }),
      description: 'Pengaturan pajak',
    },
    {
      key: 'invoice_format',
      value: JSON.stringify({
        sale: 'INV-YYYYMMDD-XXXX',
        service: 'SRV-YYYYMMDD-XXXX',
        purchase: 'PUR-YYYYMMDD-XXXX',
        payment: 'PAY-YYYYMMDD-XXXX',
      }),
      description: 'Format nomor dokumen',
    },
    {
      key: 'printer_settings',
      value: JSON.stringify({
        type: 'thermal_58mm',
        fontSize: 12,
        copies: 1,
        autoPrint: false,
      }),
      description: 'Pengaturan printer',
    },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    })
  }

  console.log('✅ Settings created')

  console.log('\n🎉 Database seeding completed!')
  console.log('\n📋 Login credentials:')
  console.log('   Admin:   admin / admin123')
  console.log('   Kasir:   kasir / admin123')
  console.log('   Teknisi: teknisi / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
