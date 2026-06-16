# MeepoBGN 🎭

Chibi Head Sticker Generator — อัพโหลดรูปหน้า → AI สร้าง chibi sticker สำหรับติด Meepo figure

## Setup

```bash
# 1. Clone & เข้าโฟลเดอร์
git clone https://github.com/tpune577-hue/MeepoBGN.git
cd MeepoBGN

# 2. Install dependencies
npm install

# 3. API key
cp .env.local.example .env.local
# แก้ GOOGLE_AI_API_KEY จาก https://aistudio.google.com/apikey

# 4. Run
npm run dev
```

## Stack

- **Next.js 14** App Router + TypeScript + Tailwind
- **Gemini 2.5 Flash** — vision analysis (วิเคราะห์หน้า)
- **Imagen 4** — image generation (gen sticker)

## Cost per image

| Model | Price/img |
|-------|-----------|
| Imagen 4 Fast | $0.02 (~0.7฿) |
| Imagen 4 Standard | $0.04 (~1.4฿) |
| Imagen 4 Ultra | $0.06 (~2.1฿) |

## Deploy (Vercel)

Repo นี้เป็น Next.js ที่ **root** ของโปรเจกต์ (ไม่ใช่โฟลเดอร์ `mvp/`)

ใน Vercel → Project → **Settings**:

1. **General → Root Directory** → ว่างไว้ (`.`) ห้ามใส่ `mvp`
2. **Git → Production Branch** → `main`
3. **Environment Variables** → `GOOGLE_AI_API_KEY`
4. **Deployment Protection** → ปิด Vercel Authentication บน Production (ถ้าต้องการให้คนทั่วไปเข้าได้)

ถ้าเห็น `404 NOT_FOUND` มักเกิดจาก:
- Root Directory ยังชี้ `mvp` (โฟลเดอร์นี้ไม่มีใน git แล้ว)
- Production Branch เป็น `develop` แต่ยังไม่มี branch นั้น
- มีหลาย Vercel project ผูก repo เดียวกัน — ควรเหลือแค่ project เดียว

## Branch

- `main` — production
- `develop` — dev (push ที่นี่เสมอ)
