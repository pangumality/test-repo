import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    // We use $executeRawUnsafe because the client might not be in sync or we want to be sure
    // But since the table name is "RadioProgram" (mapped), we can try deleteMany if client supports it
    // Or just raw SQL to be safe against schema mismatch
    await prisma.$executeRawUnsafe(`DELETE FROM "RadioProgram";`);
    console.log('Deleted all radio programs');
  } catch (e) {
    console.error(e);
  }
}
main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());