import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: "student" | "organizer" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role: "student" | "organizer" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "student" | "organizer" | "admin";
  }
}
