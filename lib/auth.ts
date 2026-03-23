import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    }),
    Credentials({
      id: "funcionario",
      name: "Funcionário",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || user.role !== "FUNCIONARIO" || !user.password) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.role = user.role;
      }
      if (trigger === "signIn" || trigger === "signUp") {
        const dbUser = await db.user.findUnique({
          where: { email: token.email! },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.plan = dbUser.plan;
          token.trialEndsAt = dbUser.trialEndsAt?.toISOString() || null;
          token.stripeCustomerId = dbUser.stripeCustomerId;
          token.stripeSubscriptionId = dbUser.stripeSubscriptionId;
          token.stripeCurrentPeriodEnd = dbUser.stripeCurrentPeriodEnd?.toISOString() || null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.plan = token.plan as string;
        session.user.trialEndsAt = token.trialEndsAt as string | null;
        session.user.stripeCustomerId = token.stripeCustomerId as string | null;
        session.user.stripeSubscriptionId = token.stripeSubscriptionId as string | null;
        session.user.stripeCurrentPeriodEnd = token.stripeCurrentPeriodEnd as string | null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      await db.user.update({
        where: { id: user.id },
        data: { plan: "TRIAL", trialEndsAt },
      });
    },
  },
});
