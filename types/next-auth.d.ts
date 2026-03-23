import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan?: string | null;
      role?: string | null;
      trialEndsAt?: string | null;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      stripeCurrentPeriodEnd?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string | null;
    plan?: string | null;
    trialEndsAt?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeCurrentPeriodEnd?: string | null;
  }
}
