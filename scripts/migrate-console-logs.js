/**
 * Migration script to help identify files that still use console.log
 * This is just a reference - actual migration should be done manually for safety
 */

const fs = require('fs');
const path = require('path');

const serverFiles = [
  'lib/services/version-context.ts',
  'lib/services/context-prompt.ts',
  'lib/services/watermark.ts',
  'lib/services/user-onboarding.ts',
  'lib/services/user-settings.ts',
  'lib/services/user-activity.ts',
  'lib/services/thumbnail.ts',
  'lib/services/storage.ts',
  'lib/services/profile-stats.ts',
  'lib/services/render-chain.ts',
  'lib/services/avatar.ts',
  'lib/actions/auth.actions.ts',
  'lib/actions/billing.actions.ts',
  'lib/actions/profile.actions.ts',
  'lib/actions/user-onboarding.actions.ts',
  'lib/actions/user-renders.actions.ts',
  'lib/actions/user-settings.actions.ts',
  'lib/actions/version-context.actions.ts',
];

console.log('Files that need migration:', serverFiles.length);
serverFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const consoleCount = (content.match(/console\.(log|warn|error|info|debug)/g) || []).length;
    if (consoleCount > 0) {
      console.log(`  ${file}: ${consoleCount} console statements`);
    }
  }
});

