import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: "$2b$10$uRkW7FDJfuo8MjLiwYOBMub4W7Ky8P9a.6k8ZZrVSu2CevulaHY7K", // bcrypt hash for "password123"
      role: "ADMIN",
      plan: {
        create: {
          planType: "ENTERPRISE",
          quota: { ai_requests: 0, image_generations: 0 },
        },
      },
    },
  });

  await prisma.business.upsert({
    where: { id: "seed-business" },
    update: {},
    create: {
      id: "seed-business",
      ownerId: user.id,
      name: "Seed Business",
      category: "Retail",
      goals: "Increase seasonal sales",
      preferredEmotion: "joy",
      preferredStyle: "modern",
      preferredPlatforms: ["instagram", "facebook"],
    },
  });

  await prisma.template.upsert({
    where: { id: "seed-template" },
    update: {},
    create: {
      id: "seed-template",
      businessId: "seed-business",
      name: "Sale Template",
      orientation: "square",
      tags: ["sale", "instagram"],
      emotionFit: ["joy"],
      placeholders: [
        { key: "title", type: "text", x: 120, y: 120, fontSize: 48, color: "#ffffff" },
        { key: "subtitle", type: "text", x: 120, y: 200, fontSize: 32, color: "#dddddd" },
        { key: "caption", type: "text", x: 120, y: 280, fontSize: 24, color: "#cccccc" },
      ],
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

