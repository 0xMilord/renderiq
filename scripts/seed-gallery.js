const { db } = require('../lib/db');
const { galleryItems, renders, users } = require('../lib/db/schema');
const { eq } = require('drizzle-orm');

async function seedGallery() {
  try {
    console.log('🌱 Seeding gallery with sample data...');

    // First, let's get some existing users and renders
    const existingUsers = await db.select().from(users).limit(3);
    const existingRenders = await db.select().from(renders).where(eq(renders.status, 'completed')).limit(5);

    if (existingUsers.length === 0) {
      console.log('❌ No users found. Please create some users first.');
      return;
    }

    if (existingRenders.length === 0) {
      console.log('❌ No completed renders found. Please create some renders first.');
      return;
    }

    // Create gallery items for existing renders
    const galleryData = existingRenders.map((render, index) => ({
      renderId: render.id,
      userId: existingUsers[index % existingUsers.length].id,
      isPublic: true,
      likes: Math.floor(Math.random() * 50),
      views: Math.floor(Math.random() * 200),
    }));

    await db.insert(galleryItems).values(galleryData);

    console.log(`✅ Created ${galleryData.length} gallery items`);
    console.log('🎉 Gallery seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding gallery:', error);
  }
}

seedGallery();
