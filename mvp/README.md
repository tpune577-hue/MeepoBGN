# MeepoBGN 🎭

Chibi Head Sticker Generator — อัพโหลดรูปหน้า → AI สร้าง chibi sticker สำหรับติด Meepo figure

## Setup

```bash
# 1. Clone & เข้าโฟลเดอร์
git clone https://github.com/tpune577-hue/MeepoBGN.git
cd MeepoBGN

# 2. Copy ไฟล์ทั้งหมดจาก zip นี้เข้าไป

# 3. Install dependencies
npm install

# 4. API key
cp .env.local.example .env.local
# แก้ GOOGLE_AI_API_KEY จาก https://aistudio.google.com/apikey

# 5. Run
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

## Branch

- `main` — production
- `develop` — dev (push ที่นี่เสมอ)
