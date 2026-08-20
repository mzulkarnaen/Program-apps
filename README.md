# Elektronik Service POS

Aplikasi manajemen toko service elektronik dan penjualan sparepart berbasis web dengan dukungan PWA (Progressive Web App) dan sinkronisasi offline-online.

## 📋 Fitur Utama

- **Penjualan Sparepart** - POS untuk penjualan produk
- **Service Elektronik** - Manajemen order service dari penerimaan hingga pengambilan
- **Transaksi Gabungan** - Satu transaksi dapat berisi sparepart dan jasa service
- **Pembayaran & Piutang** - DP, pelunasan, piutang pelanggan, hutang supplier
- **Manajemen Stok** - Pembelian, stok masuk/keluar, opname
- **Nota Thermal 58mm** - Cetak nota thermal dan invoice A4
- **Laporan** - Penjualan, service, stok, laba-rugi
- **Offline-First** - Transaksi tanpa internet, sinkronisasi otomatis saat online
- **Multi-Role** - Admin, Kasir, Teknisi dengan hak akses berbeda

## 🚀 Quick Start

### Prasyarat

- Node.js >= 18.0.0
- npm atau yarn
- Docker & Docker Compose (opsional, untuk PostgreSQL)

### 1. Clone Repository

```bash
git clone <repository-url>
cd elektronik-service-pos
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` sesuai kebutuhan:

```env
DB_USER=elektronik
DB_PASSWORD=elektronik123
DB_NAME=elektronik_pos
DB_PORT=5432

JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

API_PORT=3001
VITE_API_URL=http://localhost:3001/api
```

### 3. Jalankan Database dengan Docker

```bash
npm run docker:up
```

Atau jalankan PostgreSQL manual:

```bash
docker run --name elektronik_pos_db \
  -e POSTGRES_USER=elektronik \
  -e POSTGRES_PASSWORD=elektronik123 \
  -e POSTGRES_DB=elektronik_pos \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Setup Database

```bash
# Generate Prisma Client
cd apps/api && npx prisma generate

# Run migrations
npm run db:migrate

# Seed database dengan data awal
npm run db:seed
```

### 6. Jalankan Aplikasi

**Development mode (frontend + backend):**

```bash
npm run dev
```

Atau jalankan terpisah:

```bash
# Backend API
npm run dev:api

# Frontend Web
npm run dev:web
```

### 7. Akses Aplikasi

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **API Documentation:** http://localhost:3001/docs
- **Health Check:** http://localhost:3001/health

## 👤 Akun Default

Setelah seed database, gunakan akun berikut untuk login:

| Role    | Username | Password   |
|---------|----------|------------|
| Admin   | admin    | admin123   |
| Kasir   | kasir    | admin123   |
| Teknisi | teknisi  | admin123   |

⚠️ **PENTING:** Ganti password default setelah login pertama kali!

## 📁 Struktur Project

```
elektronik-service-pos/
├── apps/
│   ├── api/              # Backend API (Fastify + Prisma)
│   │   ├── src/
│   │   │   ├── config/   # Konfigurasi aplikasi
│   │   │   ├── plugins/  # Fastify plugins
│   │   │   ├── routes/   # API routes
│   │   │   ├── services/ # Business logic
│   │   │   ├── middleware/
│   │   │   ├── utils/    # Helper functions
│   │   │   └── types/    # TypeScript types
│   │   └── prisma/       # Prisma schema & migrations
│   └── web/              # Frontend (React + Vite)
├── packages/
│   ├── shared/           # Shared code between frontend & backend
│   └── config/           # Shared configuration
├── docker-compose.yml    # Docker orchestration
└── package.json          # Root package (monorepo)
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Run development servers
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Database commands
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio
npm run db:reset        # Reset database

# Docker commands
npm run docker:up       # Start Docker containers
npm run docker:down     # Stop Docker containers
```

## 📦 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand (state management)
- React Hook Form + Zod
- Dexie.js (IndexedDB)
- PWA with Service Worker

### Backend
- Node.js + TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Pino Logger

## 🔐 Security Features

- Password hashing dengan bcrypt
- JWT access token & refresh token
- Role-based authorization
- Input validation (Zod)
- Rate limiting
- CORS protection
- Helmet security headers
- SQL injection prevention (Prisma)
- Audit logging

## 📱 PWA Installation di Android

1. Buka aplikasi di Chrome Android
2. Tap menu (⋮) > "Tambahkan ke Layar Utama"
3. Beri nama aplikasi dan tap "Tambahkan"
4. Icon aplikasi akan muncul di home screen
5. Buka seperti aplikasi native

## 🖨️ Printer Thermal 58mm

### USB Printer (Desktop)
1. Install driver printer
2. Di pengaturan aplikasi, pilih printer USB
3. Set ukuran kertas 58mm
4. Test print

### Bluetooth Printer (Android)
1. Pairing printer Bluetooth di settings Android
2. Di aplikasi, buka Pengaturan > Printer
3. Pilih printer Bluetooth yang sudah dipairing
4. Test print

## 🔄 Sinkronisasi Offline-Online

Aplikasi menggunakan strategi offline-first:

1. **Offline Mode:**
   - Semua transaksi disimpan di IndexedDB
   - Queue perubahan dibuat otomatis
   - Status sinkronisasi ditampilkan di dashboard

2. **Online Mode:**
   - Sinkronisasi otomatis saat koneksi tersedia
   - Tombol sinkronisasi manual tersedia
   - Retry otomatis jika gagal
   - Idempotency key mencegah duplikasi

3. **Conflict Resolution:**
   - Server adalah sumber kebenaran
   - Transaksi lokal memiliki UUID unik
   - Stock movement diproses secara atomik

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product detail
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product (soft)
- `POST /api/products/:id/adjust-stock` - Adjust stock

*(Lihat dokumentasi lengkap di `/docs`)*

## 📝 License

MIT License

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

Untuk pertanyaan atau bantuan:
- Email: support@elektronikservice.com
- WhatsApp: 081234567890

---

**Elektronik Service POS** © 2024
