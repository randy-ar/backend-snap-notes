import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const struks = await prisma.struk.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { itemStruks: true }
  });
  
  console.log(JSON.stringify(struks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
