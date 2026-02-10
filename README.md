<div align="center">

#  ReachInbox Assignment
### The Ultimate Full-Stack Email Scheduling Platform

**TypeScript** • **Next.js 14** • **Node.js 20** • **Redis (BullMQ)** • **PostgreSQL (Prisma)**

<p align="center">
  <a href="#-key-features">Key Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-deployment">Deployment</a>
</p>

</div>

---

## 📖 Project Overview

**ReachInbox** is a production-grade One-on-One cold email outreach platform. It allows users to schedule personalized emails to be sent at a future date and time.

Unlike standard implementations, this project features a **custom Split-Screen Design**, a unique **Dual-Authentication flow** (Google OAuth + Custom Registration), and a robust **Distributed Queue System** that ensures 100% reliable delivery even during server restarts.

---

## ✨ Key Features

### 🔐 Advanced Authentication
- **Dual Auth System**: Seamlessly combine Google OAuth with a custom registration step to capture user details (like Name) that OAuth might miss.
- **Secure Session Management**: Powered by `NextAuth.js`.

### 🎨 Modern UI/UX
- **Split Layout**: A professional, branded left-panel and focused right-panel for login/registration.
- **Client-Side Validation**: Real-time feedback and dynamic form adjustments.
- **Theme**: Clean, accessible, and responsive design using **TailwindCSS**.

### ⚙️ Powerful Backend
- **Precision Scheduling**: Uses **BullMQ** and **Redis** to handle delayed jobs with millisecond precision.
- **Fault Tolerance**: If the server crashes, persistent Redis queues ensure no scheduled email is ever lost.
- **Rate Limiting**: Implements a "Token Bucket" style limiter to respect SMTP provider quotas (e.g., Gmail's limits).
- **Concurrency**: Process multiple email jobs simultaneously with optimized worker threads.

---

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | ![Next.js](https://img.shields.io/badge/-Next.js-black) ![Tailwind](https://img.shields.io/badge/-Tailwind-38B2AC) | Next.js 14, React 19, Lucide Icons |
| **Backend** | ![Node.js](https://img.shields.io/badge/-Node.js-green) ![Express](https://img.shields.io/badge/-Express-black) | TypeScript, Express.js |
| **Database** | ![Postgres](https://img.shields.io/badge/-PostgreSQL-336791) ![Prisma](https://img.shields.io/badge/-Prisma-1B222D) | Managed via Supabase/Render |
| **Queue** | ![Redis](https://img.shields.io/badge/-Redis-DC382D) | BullMQ for job scheduling |
| **DevOps** | ![Docker](https://img.shields.io/badge/-Docker-2496ED) | Docker Compose for local dev |

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
- **Node.js** (v18+)
- **Docker** (for Redis/Postgres) OR local instances.

### 1. Clone & Setup
```bash
git clone https://github.com/imgovind95/ReachInbox-Task-main.git
cd ReachInbox-Task-main
```

### 2. Backend Setup
```bash
cd server
npm install
# Copy example env
cp .env.example .env
# Start DB (if using Docker)
docker-compose up -d
# Push Schema
npx prisma db push
# Run Dev Server
npm run dev
```
> Server runs on `http://localhost:3000`

### 3. Frontend Setup
```bash
cd client
npm install
# Configure .env.local (see below)
npm run dev
```
> Client runs on `http://localhost:3001`

---

## 🔒 Environment Variables

<details>
<summary>Click to view <code>server/.env</code></summary>

```env
DATABASE_URL="postgresql://user:password@localhost:5432/reachinbox"
REDIS_HOST="localhost"
REDIS_PORT="6379"
GOOGLE_CLIENT_ID="your_google_id"
GOOGLE_CLIENT_SECRET="your_google_secret"
JWT_SECRET="your_jwt_secret"
CLIENT_URL="http://localhost:3001"
```
</details>

<details>
<summary>Click to view <code>client/.env.local</code></summary>

```env
GOOGLE_CLIENT_ID="your_google_id"
GOOGLE_CLIENT_SECRET="your_google_secret"
NEXTAUTH_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"
```
</details>

---

## 🌐 Deployment

The system is designed for easy deployment on **Render** (Backend) and **Vercel** (Frontend).

### Render (Backend)
1.  Create a **Web Service** connected to the `server` directory.
2.  **Build Command**: `npm install && npm run build`
3.  **Start Command**: `npm start`
4.  Add Environment Variables from your `.env`.

### Vercel (Frontend)
1.  Import the `client` directory.
2.  Add `NEXT_PUBLIC_API_URL` pointing to your Render backend URL.
3.  Deploy!

---

## 👤 Author

**User**
- Github: [@imgovind95](https://github.com/imgovind95)

---

<div align="center">
  <sub>Built for ReachInbox Assessment</sub>
</div>
