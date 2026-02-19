import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: "student" | "organizer" | "sponsor" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role: "student" | "organizer" | "sponsor" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "student" | "organizer" | "sponsor" | "admin";
  }
}
