const { db } = require('../lib/db');
const { ProjectsDAL } = require('../lib/dal/projects');
const { RendersDAL } = require('../lib/dal/renders');
const { users, projects, renders } = require('../lib/db/schema');
const { eq } = require('drizzle-orm');

async function testProjectCards() {
  try {
    console.log('🧪 Testing project cards functionality...');

    // Get a user
    const [user] = await db.select().from(users).limit(1);
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log('👤 Testing with user:', user.email);

    // Test getting projects with render counts
    console.log('📊 Testing getByUserIdWithRenderCounts...');
    const projectsWithCounts = await ProjectsDAL.getByUserIdWithRenderCounts(user.id);
    console.log(`✅ Found ${projectsWithCounts.length} projects with render counts`);
    
    projectsWithCounts.forEach(project => {
      console.log(`  - ${project.name}: ${project.renderCount} renders`);
    });

    // Test getting latest renders for a project
    if (projectsWithCounts.length > 0) {
      const project = projectsWithCounts[0];
      console.log(`🖼️ Testing getLatestRenders for project: ${project.name}`);
      
      const latestRenders = await ProjectsDAL.getLatestRenders(project.id, 4);
      console.log(`✅ Found ${latestRenders.length} latest renders`);
      
      latestRenders.forEach((render, index) => {
        console.log(`  - Render ${index + 1}: ${render.status} (${render.type})`);
      });
    }

    console.log('🎉 Project cards functionality test completed!');
  } catch (error) {
    console.error('❌ Error testing project cards:', error);
  }
}

testProjectCards();
