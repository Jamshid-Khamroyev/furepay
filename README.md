# FurePay

FurePay - bloglar va notelar yaratish, boshqarish va baham ko'rish uchun mo'ljallangan zamonaviy full-stack web ilovasi. Real-time yangilanishlar, to'lov tizimi va foydalanuvchilararo interaktivlikni qo'llab-quvvatlaydi.

## 📋 Tarkib

- [Loyiha Haqida](#loyiha-haqida)
- [Asosiy Xususiyatlar](#asosiy-xususiyatlar)
- [Texnologiyalar](#texnologiyalar)
- [Arxitektura](#arxitektura)
- [Environment O'zgaruvchilari](#environment-ozgaruvchilari)
- [Setup Qadamlari](#setup-qadamlari)
- [API Endpoints](#api-endpoints)
- [Real-time Events](#real-time-events)
- [Deploy](#deploy)

## 🎯 Loyiha Haqida

FurePay - bu foydalanuvchilarga bloglar va notelar yaratish, tahrirlash, baham ko'rish va boshqarish imkoniyatini beruvchi platforma. Loyiha quyidagilar uchun mo'ljallangan:

- **Blog yozuvchilari** - O'z bloglarini yaratish va nashr etish uchun
- **Note qoldiruvchilar** - Eslatmalar va notelar saqlash uchun
- **Jamoa a'zolari** - Real-time yangilanishlar orqali hamkorlik qilish uchun
- **Dasturchilar** - Full-stack web dasturlashni o'rganish uchun

## ✨ Asosiy Xususiyatlar

### 👤 Foydalanuvchi Tizimi
- **Ro'yxatdan o'tish** - Email va parol bilan
- **Kirish** - Email/parol yoki Google OAuth bilan
- **Profil boshqaruvi** - Avatar, bio, username
- **Rol tizimi** - USER va ADMIN rollari
- **Plan tizimi** - FREE va PREMIUM planlar

### 📝 Blog Tizimi
- Blog yaratish, tahrirlash, o'chirish
- Rich text editor (TipTap)
- Blog qidirish va filtrlash (latest, oldest, popular, trending)
- Taglar bilan kategorizatsiya
- Blogga izoh qoldirish
- Blogga like bosish
- Real-time yangilanishlar

### 📒 Note Tizimi
- Note yaratish, tahrirlash, o'chirish
- Rasm yuklash (ImageKit orqali)
- Note'larga like bosish
- Real-time yangilanishlar

### 💳 To'lov Tizimi
- Stripe integratsiyasi
- Premium plan xarid qilish
- Webhook orqali to'lov tasdiqlash

### ⚡ Real-time Xususiyatlar
- Blog va note like'lari real-time
- Notelar va bloglarni qo'shish, o'chirish, yangilash real-time
- Blogga qo'shilgan yangi izoh real-time
- Foydalanuvchilarning online/offline holati

### 🔒 Xavfsizlik
- JWT token based autentifikatsiya
- httpOnly cookies
- Password hashing (bcrypt)
- CORS konfiguratsiyasi

## 🛠 Texnologiyalar

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Typing
- **Prisma** - ORM
- **PostgreSQL** - Ma'lumotlar bazasi
- **Socket.io** - Real-time communication
- **Stripe** - To'lov tizimi
- **Google Auth Library** - OAuth
- **ImageKit** - Rasm yuklash
- **JWT** - Autentifikatsiya
- **bcrypt** - Password hashing

### Frontend
- **React 19** - UI library
- **TypeScript** - Typing
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **Zustand** - State management
- **TipTap** - Rich text editor
- **Lucide React** - Icons
- **Sonner** - Toast notifications
- **Google OAuth** - Autentifikatsiya

## 🏗 Arxitektura

## 🔑 Environment O'zgaruvchilari

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT
JWT_SECRET="your_jwt_secret_key"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"

# ImageKit
IMAGEKIT_PUBLIC_KEY="your_imagekit_public_key"
IMAGEKIT_PRIVATE_KEY="your_imagekit_private_key"
IMAGEKIT_URL_ENDPOINT="your_imagekit_url_endpoint"

# Stripe
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_PRICE_ID="your_stripe_price_id"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# Server
PORT=3001
CLIENT_URL="http://localhost:3000"
```

### Frontend (.env)
```env
# API
VITE_API_URL="http://localhost:3001"

# Google OAuth (agar kerak bo'lsa)
VITE_GOOGLE_CLIENT_ID="your_google_client_id"

# Gemini AI (agar kerak bo'lsa)
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
```

## 🚀 Setup Qadamlari

### Talablar
- Node.js (v18 yoki yuqori)
- PostgreSQL
- npm yoki yarn

### Backend Setup

1. **Repositoryni klonlash**
```bash
git clone <repository-url>
cd furepay/backend
```

2. **Dependenciesni o'rnatish**
```bash
npm install
```

3. **Environment faylini yaratish**
```bash
cp .env.example .env
```

4. **.env faylini to'ldirish**
Yuqoridagi backend environment o'zgaruvchilarini kiriting

5. **Prisma setup**
```bash
npx prisma generate
npx prisma migrate dev
```

6. **Serverni ishga tushirish**
```bash
npm start
```

Server `http://localhost:3001` da ishga tushadi

### Frontend Setup

1. **Frontend papkasiga o'tish**
```bash
cd ../frontend
```

2. **Dependenciesni o'rnatish**
```bash
npm install
```

3. **Environment faylini yaratish**
```bash
cp .env.example .env
```

4. **.env faylini to'ldirish**
Yuqoridagi frontend environment o'zgaruvchilarini kiriting

5. **Development serverni ishga tushirish**
```bash
npm run dev
```

Frontend `http://localhost:3000` da ishga tushadi

## 🚀 Deploy

### Backend Deploy (Masalan, Render/Railway)
1. PostgreSQL database yaratish
2. Environment o'zgaruvchilarini sozlash
3. `npm install` va `npx prisma generate` ishga tushirish
4. `npx prisma migrate deploy` ishga tushirish
5. `npm start` bilan serverni ishga tushirish

### Frontend Deploy (Masalan, Vercel/Netlify)
1. `VITE_API_URL` ni production URLga sozlash
2. `npm run build` bilan build olish
3. Build natijasini deploy qilish

### Muhim Eslatmalar
- Productionda `CLIENT_URL` ni production frontend URLga sozlang
- Stripe webhook URL'ini production backend URLga sozlang
- ImageKit va Google OAuth callback URL'larini production URL'ga qo'shing

## 📄 Litsenziya

Bu loyiha o'quv maqsadlarida yaratilgan.

## 👨‍💻 Dasturchi

Loyiha full-stack web dasturlashni o'rganish jarayonida yaratilgan.

---

**Qo'shimcha ma'lumot uchun**: backend va frontend papkalaridagi README fayllariga murojaat qiling.