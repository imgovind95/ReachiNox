import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
                name: { label: "Name", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                    console.log("Attempting login with API URL:", apiUrl);

                    const payload = {
                        email: credentials.email,
                        name: credentials.name,
                        avatar: '',
                        googleId: `dummy-${credentials.email}`,
                    };
                    console.log("Login Payload:", JSON.stringify(payload));

                    const response = await fetch(`${apiUrl}/api/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        return data.user ? { ...data.user, id: data.user.id } : null;
                    } else {
                        console.error("Login failed with status:", response.status, await response.text());
                    }
                } catch (error) {
                    console.error("Credentials Auth Failed:", error);
                }
                return null;
            }
        })
    ],
    debug: process.env.NODE_ENV === 'development',
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account }) {
            return true;
        },
        async jwt({ token, user, account }) {
            // 1. Initial Sign In
            if (user) {
                token.email = user.email;
                token.name = user.name;
                token.picture = (user as any).image || (user as any).avatar;
                if (account?.provider === 'credentials') {
                    token.backendId = (user as any).id;
                }
            }

            // 2. Sync Google User (if backendId missing) OR Fallback Sync (if name/avatar missing)
            const isNameMissing = !token.name || token.name === 'undefined';
            const isPictureMissing = !token.picture || token.picture === 'undefined';
            const needsSync = !token.backendId || (token.email && (isNameMissing || isPictureMissing));

            if (needsSync && token.email) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

                    const response = await fetch(`${apiUrl}/api/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: token.email,
                            name: token.name,
                            avatar: token.picture,
                            googleId: account?.providerAccountId || `dummy-${token.email}`,
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.user) {
                            if (data.user.id) token.backendId = data.user.id;
                            if (data.user.name) token.name = data.user.name;
                            if (data.user.avatar) token.picture = data.user.avatar;
                        }
                    } else {
                        console.error("User Sync failed:", response.status);
                    }
                } catch (error) {
                    console.error("Backend Sync Error:", error);
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.image = token.picture as string;
                if (token.backendId) {
                    (session.user as any).id = token.backendId;
                }
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // 1. Explicit Dashboard Redirection
            if (url.includes("/dashboard")) {
                return `${baseUrl}/dashboard`;
            }
            // 2. If url is root (login page) and we are redirecting, go to dashboard
            if (url === baseUrl || url === `${baseUrl}/`) {
                return `${baseUrl}/dashboard`;
            }
            // 3. Internal relative paths
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }
            // 4. Default fallback
            return `${baseUrl}/dashboard`;
        }
    },
    pages: {
        signIn: "/",
    }
});

export { handler as GET, handler as POST };