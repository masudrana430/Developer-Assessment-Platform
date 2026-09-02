import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { config } from "../src/config";
import { prisma } from "../src/lib/prisma";

const seedUser = async (
  name: string,
  email: string,
  password: string,
  role: Role
) => {
  const hashed = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      status: "ACTIVE",
      deletedAt: null
    },
    create: {
      name,
      email,
      password: hashed,
      role
    }
  });
};

export const seedDemoUsers = async () => {
  await seedUser(
    config.SEED_ADMIN_NAME,
    config.SEED_ADMIN_EMAIL,
    config.SEED_ADMIN_PASSWORD,
    Role.ADMIN
  );
  await seedUser(
    config.SEED_REVIEWER_NAME,
    config.SEED_REVIEWER_EMAIL,
    config.SEED_REVIEWER_PASSWORD,
    Role.REVIEWER
  );
  await seedUser(
    config.SEED_CANDIDATE_NAME,
    config.SEED_CANDIDATE_EMAIL,
    config.SEED_CANDIDATE_PASSWORD,
    Role.CANDIDATE
  );
  console.log("Demo users are ready.");
};

if (require.main === module) {
  seedDemoUsers()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
