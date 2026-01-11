import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Force dynamic rendering for NextAuth API routes
export const dynamic = 'force-dynamic';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        let role: "student" | "organizer" | "admin" = "student";

        if (credentials.email === "admin@test.com") role = "admin";
        if (credentials.email === "organizer@test.com") role = "organizer";

        return {
          id: credentials.email,
          email: credentials.email,
          role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;        // ✅ FIX
        token.role = (user as any).role; // ✅ FIX
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string; // ✅ FIX
        session.user.role = token.role as
          | "student"
          | "organizer"
          | "admin";
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
