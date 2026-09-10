// ============================================================================
// Database Seed Script — Initial demo data for Granny
// ============================================================================
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Granny database...');

  // Create demo elder user
  const elder = await prisma.user.upsert({
    where: { email: 'margaret@demo.com' },
    update: {},
    create: {
      name: 'Margaret',
      email: 'margaret@demo.com',
      role: 'ELDER',
      language: 'en',
      passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // "password"
    },
  });

  // Create elder profile
  await prisma.elderProfile.upsert({
    where: { userId: elder.id },
    update: {},
    create: {
      userId: elder.id,
      ageGroup: '70-80',
      interests: ['music', 'cooking', 'gardening', 'stories'],
      cognitiveLvl: 3,
      culturalTags: ['south-indian', 'tamil'],
      voiceTone: 'warm_compassionate',
      emergencyContact: '+91-9876543210',
    },
  });

  // Create caregiver user
  const caregiver = await prisma.user.upsert({
    where: { email: 'priya@demo.com' },
    update: {},
    create: {
      name: 'Priya',
      email: 'priya@demo.com',
      role: 'CAREGIVER',
      language: 'en',
      passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    },
  });

  // Create family group and link
  let familyGroup = await prisma.familyGroup.findFirst({
    where: { name: "Margaret's Family" },
  });

  if (!familyGroup) {
    familyGroup = await prisma.familyGroup.create({
      data: {
        name: "Margaret's Family",
        members: {
          connect: [{ id: elder.id }, { id: caregiver.id }],
        },
      },
    });
  }

  // Consent record
  const existingConsent = await prisma.consentRecord.findFirst({
    where: {
      elderId: elder.id,
      caregiverId: caregiver.id,
    },
  });

  if (!existingConsent && familyGroup) {
    await prisma.consentRecord.create({
      data: {
        familyGroupId: familyGroup.id,
        elderId: elder.id,
        caregiverId: caregiver.id,
        scope: 'memories',
        granted: true,
        grantedAt: new Date(),
      },
    });
  }

  // Seed game catalog
  const games = [
    { key: 'remember_my_home', name: 'Remember My Home' },
    { key: 'memory_market', name: 'Memory Market' },
    { key: 'name_face_match', name: 'Name & Face Match' },
    { key: 'recipe_recall', name: 'Recipe Recall' },
    { key: 'memory_journey', name: 'Memory Journey' },
    { key: 'complete_the_tune', name: 'Complete the Tune' },
    { key: 'story_detective', name: 'Story Detective' },
    { key: 'where_did_i_keep_it', name: 'Where Did I Keep It' },
    { key: 'memory_garden', name: 'Memory Garden' },
    { key: 'memory_album', name: 'Memory Album' },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { key: game.key },
      update: {},
      create: game,
    });
  }

  // Seed sample memories
  const existingMemories = await prisma.memory.count({ where: { userId: elder.id } });
  if (existingMemories === 0) {
    await prisma.memory.createMany({
      data: [
        { userId: elder.id, type: 'anecdote', title: 'My wedding day', content: 'I married Rajan in 1975. The temple was decorated with jasmine flowers.', tags: ['wedding', 'family'] },
        { userId: elder.id, type: 'anecdote', title: 'First grandchild', content: 'Priya was born on March 15, 2005. She had the most beautiful eyes.', tags: ['family', 'grandchild'] },
        { userId: elder.id, type: 'routine', title: 'Morning routine', content: 'Wake up at 6 AM, have tea, do prayer, walk in garden, then breakfast.', tags: ['daily', 'routine'] },
        { userId: elder.id, type: 'fact', title: 'Favorite song', content: 'I love the old melody "Vellai Pookal" — reminds me of my youth.', tags: ['music', 'favorites'] },
        { userId: elder.id, type: 'fact', title: 'Favorite food', content: 'I love dosai with coconut chutney. My mother taught me the recipe.', tags: ['food', 'cooking'] },
      ],
    });
  }

  // Seed sample reminders
  const existingReminders = await prisma.reminder.count({ where: { userId: elder.id } });
  if (existingReminders === 0) {
    await prisma.reminder.createMany({
      data: [
        { userId: elder.id, type: 'medication', title: 'Morning Medicine', scheduleCron: '0 8 * * *' },
        { userId: elder.id, type: 'hydration', title: 'Drink Water', scheduleCron: '0 10 * * *' },
        { userId: elder.id, type: 'medication', title: 'Afternoon Medicine', scheduleCron: '0 14 * * *' },
        { userId: elder.id, type: 'activity', title: 'Evening Walk', scheduleCron: '0 16 * * *' },
        { userId: elder.id, type: 'medication', title: 'Night Medicine', scheduleCron: '0 20 * * *' },
      ],
    });
  }

  console.log('✅ Seed complete!');
  console.log(`   Elder: ${elder.name} (${elder.email})`);
  console.log(`   Caregiver: ${caregiver.name} (${caregiver.email})`);
  console.log(`   Password for both: "password"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
