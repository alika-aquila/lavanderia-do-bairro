import { PrismaClient } from "@prisma/client";
// bcryptjs must be installed: npm install bcryptjs @types/bcryptjs
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("lavanderia123", 10);

  await db.user.upsert({
    where: { email: "funcionario@lavanderia.com" },
    update: {},
    create: {
      name: "Funcionário",
      email: "funcionario@lavanderia.com",
      password,
      role: "FUNCIONARIO",
      plan: "PRO",
    },
  });

  console.log("✅ Funcionário criado: funcionario@lavanderia.com / lavanderia123");
}

main().catch(console.error).finally(() => db.$disconnect());
