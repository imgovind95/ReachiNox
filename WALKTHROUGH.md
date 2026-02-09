# My ReachInbox Project

This is a custom implementation of the ReachInbox selection task. It features a full-stack architecture with a unique registration flow and optimized user experience, presented in a modern split-screen layout.

## 🚀 Unique Features (Why this is *Your* Project)

Unlike standard implementations, this project includes:

1.  **Dual Authentication System**:
    -   **Google OAuth**: seamless one-click login.
    -   **Custom Registration**: A dedicated "Register" vs "Login" toggle that allows new users to provide their **Name** explicitly.
    -   **Smart Data Sync**: The backend intelligentlly updates user details, ensuring your name is never overwritten by accident.

2.  **Enhanced UI/UX**:
    -   **Split Desktop Layout**: A modern, professional design with a dedicated branding panel on the left and a focused login form on the right.
    -   **Interactive Elements**: All buttons and links feature proper `cursor-pointer` feedback.
    -   **Conditional Rendering**: The registration form dynamically adapts to show/hide fields based on user intent.

## 🛠️ Tech Stack & Structure

-   **Frontend**: `client/` (Next.js 14, TailwindCSS, NextAuth)
-   **Backend**: `server/` (Express, TypeScript, Prisma, BullMQ, Redis)
-   **Database**: PostgreSQL (Data persistence), Redis (Job queue)

## ⚡ How to Run "Working Everything Steps"

Follow these exact steps to run your project from scratch:

### 1. Prerequisites
Ensure you have the following running:
-   **PostgreSQL Database**: Accessible via your `DATABASE_URL`.
-   **Redis Server**: Running on port `6379`.

### 2. Start the Backend
Open a terminal in the root directory:
```bash
cd server
npm install  # Only needed the first time
npx prisma db push # Sync database schema
npm run dev
```
*The server will start on http://localhost:3000*

### 3. Start the Frontend
Open a **new** terminal in the root directory:
```bash
cd client
npm install # Only needed the first time
npm run dev
```
*The client will start on http://localhost:3001*

### 4. Verify Functionality
1.  Open `http://localhost:3001` in your browser.
2.  **Observe the Layout**: On desktop, you will see a welcome panel on the left and the login form on the right.
3.  Click **"Register"** to create a new account with your name.
4.  Once logged in, you will be redirected to the dashboard.

## 🔒 Environment Configuration

Your project is configured with the following secure environment files (do not commit these):
-   `server/.env`: Contains `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`, `REDIS_HOST`.
-   `client/.env.local`: Contains `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL` and Google Credentials.

## 📝 Ownership
-   **Author**: User
-   **Repository**: [Your GitHub Repo]

This project is now fully configured, personalized, and ready for further feature development!
