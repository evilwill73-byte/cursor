import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/index";

function generateApiKey(): { fullKey: string; prefix: string } {
  const random = randomBytes(24).toString("hex");
  const fullKey = `sk_live_${random}`;
  const prefix = fullKey.slice(0, 16);
  return { fullKey, prefix };
}

async function main() {
  const superEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@platform.local";
  const superPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "Admin123!";
  const appSlug = process.env.SEED_APP_SLUG ?? "socalmedic";
  const appName = process.env.SEED_APP_NAME ?? "SoCalMedic";

  const passwordHash = await bcrypt.hash(superPassword, 12);

  const superAdmin = await prisma.adminUser.upsert({
    where: { email: superEmail },
    update: {},
    create: {
      email: superEmail,
      passwordHash,
      name: "Platform Super Admin",
      role: "super_admin",
    },
  });

  const app = await prisma.app.upsert({
    where: { slug: appSlug },
    update: {},
    create: {
      slug: appSlug,
      name: appName,
      bundleId: "com.socalmedic.app",
      webDomain: "www.socalmedic.com",
      themeJson: {
        primaryColor: "#E11D48",
        secondaryColor: "#1E1B4B",
        logoUrl: null,
      },
      featuresJson: {
        shorts: true,
        longForm: true,
        subscriptions: false,
      },
    },
  });

  const existingKey = await prisma.apiKey.findFirst({
    where: { appId: app.id, isActive: true },
  });

  let apiKeyPlain: string | null = null;

  if (!existingKey) {
    const { fullKey, prefix } = generateApiKey();
    const keyHash = await bcrypt.hash(fullKey, 12);
    await prisma.apiKey.create({
      data: {
        appId: app.id,
        keyHash,
        keyPrefix: prefix,
        name: "production",
        scopes: ["read:content", "write:analytics"],
      },
    });
    apiKeyPlain = fullKey;
  }

  const appAdminEmail = `admin@${appSlug}.local`;
  const appAdminPassword = "AppAdmin123!";
  await prisma.adminUser.upsert({
    where: { email: appAdminEmail },
    update: {},
    create: {
      email: appAdminEmail,
      passwordHash: await bcrypt.hash(appAdminPassword, 12),
      name: `${appName} Admin`,
      role: "app_admin",
      appId: app.id,
    },
  });

  console.log("\n✅ Seed complete\n");
  console.log("Super Admin:", superEmail, "/", superPassword);
  console.log("App Admin:", appAdminEmail, "/", appAdminPassword);
  console.log("App slug (X-App-Id):", app.slug);
  if (apiKeyPlain) {
    console.log("\n⚠️  Save this API key — shown only once:");
    console.log("API Key:", apiKeyPlain);
  } else {
    console.log("\nAPI key already exists (not re-printed).");
  }
  console.log("\nSuper admin id:", superAdmin.id);
  console.log("App id:", app.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
