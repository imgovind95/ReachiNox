# ReachInbox Client

This is the frontend application for ReachInbox, a powerful email scheduling and management platform. It is built with **Next.js (App Router)** and designed to provide a seamless user experience for managing email campaigns.

## 🚀 Features

-   **Google OAuth Authentication**: Secure and seamless login using your Google account via NextAuth.js.
-   **Dashboard**: A centralized hub for all your email activities.
-   **Inbox**: View and manage received emails in real-time.
-   **Compose & Schedule**: Create email campaigns and schedule them for future delivery.
-   **Sent Items**: Track emails that have been successfully sent.
-   **Scheduled Emails**: View and manage queued emails waiting to be sent.
-   **Responsive Design**: Fully responsive interface built with Tailwind CSS.

## 🛠 Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Directory)
-   **Language**: TypeScript
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
-   **HTTP Client**: Axios

## ⚙️ Environment Variables

To run this project locally, you need to set up the following environment variables in a `.env.local` file in the root of the `client` directory:

```bash
# Google OAuth Credentials (obtain from Google Cloud Console)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3001" # The URL of your client app
NEXTAUTH_SECRET="your_jwt_secret" # A random string for encryption

# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:3000" # The URL of your running backend server
```

## 📦 Getting Started

### 1. Installation

Install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Run Development Server

Start the local development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001).

> **Note:** Ensure your backend server is running on `http://localhost:3000` (or your configured port) for full functionality.

## 📂 Project Structure

-   `app/`: Main application routes (App Router).
    -   `app/dashboard/`: Dashboard pages (Inbox, Compose, etc.).
    -   `app/api/auth/`: NextAuth authentication routes.
-   `components/`: Reusable UI components.
-   `public/`: Static assets.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
