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
                    const payload = {
                        email: credentials.email,
                        name: credentials.name,
                        avatar: '',
                        googleId: `dummy-${credentials.email}`,
                    };
                    const response = await fetch(`${apiUrl}/api/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    if (response.ok) {
                        const data = await response.json();
                        return data.user ? { ...data.user, id: data.user.id } : null;
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
            if (user) {
                token.email = user.email;
                token.name = user.name;
                token.picture = (user as any).image || (user as any).avatar;
                if (account?.provider === 'credentials') {
                    token.backendId = (user as any).id;
                }
            }

            if (!token.backendId && token.email && account?.provider === 'google') {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
                    const response = await fetch(`${apiUrl}/api/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: token.email,
                            name: token.name,
                            avatar: token.picture,
                            googleId: account.providerAccountId,
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.user?.id) {
                            token.backendId = data.user.id;
                        }
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
            // Priority: Dashboard
            if (url.includes("/dashboard")) return `${baseUrl}/dashboard`;
            // Internal relative paths
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            return baseUrl;
        }
    },
    pages: {
        signIn: "/",
    }
});

export { handler as GET, handler as POST };