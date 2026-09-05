import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Elderly AI database...');
  // Seed initial mock user
  const user = await prisma.user.upsert({
    where: { phoneNumber: '+919876543210' },
    update: {},
    create: {
      name: 'Kamakshi Amma',
      phoneNumber: '+919876543210',
      role: 'ELDERLY',
      language: 'TA',
      profile: {
        create: {
          emergencyContact: '+919876543211',
          medicalNotes: 'Mild hypertension, prescribed morning medication.',
          voiceTone: 'warm_compassionate',
        },
      },
    },
  });

  console.log('Seeded sample user:', user.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
