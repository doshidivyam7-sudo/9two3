// Seed the companies universe so the app is usable immediately after
// `prisma db push && prisma db seed`. Real data flows through the configured
// provider; this just populates the metadata layer.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MOCK_UNIVERSE } from "../lib/data/providers/mock";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding company universe…");
  for (const row of MOCK_UNIVERSE) {
    await prisma.company.upsert({
      where: { ticker: row.ticker },
      update: {
        name: row.name,
        sector: row.sector,
        industry: row.industry,
        description: row.description,
        marketCapCr: row.price * row.shares,
      },
      create: {
        ticker: row.ticker,
        name: row.name,
        sector: row.sector,
        industry: row.industry,
        description: row.description,
        marketCapCr: row.price * row.shares,
        exchange: "NSE",
        currency: "INR",
        country: "IN",
      },
    });
  }

  if (process.env.SEED_DEMO_USER) {
    const email = "analyst@example.com";
    const passwordHash = await bcrypt.hash("change-me-now", 12);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: "Demo Analyst",
        passwordHash,
        role: "ANALYST",
        preferences: { create: {} },
        watchlists: { create: { name: "Default" } },
        portfolios: { create: { name: "Core" } },
      },
    });
    console.log(`Demo user created: ${email} / change-me-now`);
  }

  console.log(`Seeded ${MOCK_UNIVERSE.length} companies.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
