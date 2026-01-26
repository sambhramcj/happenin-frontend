import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering for NextAuth API routes
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // Conditionally add Apple provider only if env is present
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY
      ? [
          AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID,
            // Generate a JWT client secret for Apple (valid up to 6 months)
            clientSecret: (() => {
              const teamId = process.env.APPLE_TEAM_ID as string;
              const keyId = process.env.APPLE_KEY_ID as string;
              const privateKey = (process.env.APPLE_PRIVATE_KEY as string).replace(/\\n/g, "\n");
              const clientId = process.env.APPLE_CLIENT_ID as string;
              const now = Math.floor(Date.now() / 1000);
              return jwt.sign(
                {
                  iss: teamId,
                  iat: now,
                  exp: now + 60 * 60 * 24 * 180, // 180 days
                  aud: "https://appleid.apple.com",
                  sub: clientId,
                },
                privateKey,
                {
                  algorithm: "ES256",
                  keyid: keyId,
                }
              );
            })(),
          }),
        ]
      : []),
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

        try {
          // Get user from database with password_hash
          const { data: user, error } = await supabase
            .from("users")
            .select("email, password_hash, role, college_id")
            .eq("email", credentials.email)
            .single();

          if (error || !user) {
            return null;
          }

          // Verify password using bcrypt
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.email,
            email: user.email,
            role: user.role,
          };
        } catch (err) {
          console.error("Auth error:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, auto-create user in DB if doesn't exist
      if (account?.provider === "google" || account?.provider === "apple") {
        if (!user.email) return false;

        try {
          const { data: existingUser } = await supabase
            .from("users")
            .select("email, role")
            .eq("email", user.email)
            .single();

          if (!existingUser) {
            // Create new user with default role "student"
            const { error } = await supabase
              .from("users")
              .insert({
                email: user.email,
                role: "student",
                password_hash: "", // OAuth users don't need password
              });

            if (error) {
              console.error("Failed to create OAuth user:", error);
              return false;
            }
          }
        } catch (err) {
          console.error("OAuth signIn error:", err);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.email = user.email;
        // Fetch role from database for OAuth users
        if (account?.provider === "google" || account?.provider === "apple") {
          const { data: dbUser } = await supabase
            .from("users")
            .select("role")
            .eq("email", user.email!)
            .single();
          
          token.role = dbUser?.role || "student";
        } else {
          token.role = (user as any).role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
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
    signIn: "/auth",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
