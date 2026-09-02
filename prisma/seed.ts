import { prisma } from "../src/lib/prisma";
import { seedDemoUsers } from "../src/utils/seed";

seedDemoUsers()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
