// Test script to verify no client-side database access
const fs = require('fs');
const path = require('path');

function checkForClientSideDBUsage() {
  console.log('🔍 Checking for client-side database usage...');
  
  const projectCardPath = path.join(__dirname, '../components/projects/project-card.tsx');
  const content = fs.readFileSync(projectCardPath, 'utf8');
  
  // Check for problematic imports (excluding type imports)
  const problematicImports = [
    'import.*ProjectsDAL',
    'import.*RendersDAL', 
    'import.*db',
    'import.*drizzle-orm',
    'import.*lib/dal',
    'import.*lib/db.*from'
  ];
  
  let foundIssues = false;
  
  problematicImports.forEach(pattern => {
    const regex = new RegExp(pattern, 'g');
    if (regex.test(content)) {
      console.log(`❌ Found client-side database usage: ${pattern}`);
      foundIssues = true;
    }
  });
  
  // Check for useEffect with database calls
  if (content.includes('useEffect') && content.includes('fetchLatestRenders')) {
    console.log('❌ Found useEffect with database fetching');
    foundIssues = true;
  }
  
  if (!foundIssues) {
    console.log('✅ No client-side database usage found!');
    console.log('✅ ProjectCard component is properly using props instead of direct DB access');
  }
  
  return !foundIssues;
}

const isClean = checkForClientSideDBUsage();

if (isClean) {
  console.log('🎉 Client-side database access fix is working correctly!');
} else {
  console.log('❌ Still has client-side database access issues');
  process.exit(1);
}
