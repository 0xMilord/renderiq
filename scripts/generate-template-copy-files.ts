#!/usr/bin/env tsx
/**
 * Generate Template Copy Files for Dashboard Deployment
 * Creates individual files for easy copy-paste into Supabase Dashboard
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_REF = 'ncfgivjhkvorikuebtrl';
const templatesDir = path.join(process.cwd(), 'supabase', 'templates');
const outputDir = path.join(process.cwd(), 'supabase', 'dashboard-templates');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const TEMPLATE_INFO = {
  'confirmation.html': {
    name: 'Confirm sign up',
    category: 'Authentication',
    dashboardPath: 'Authentication → Email Templates → Confirm sign up',
  },
  'recovery.html': {
    name: 'Reset password',
    category: 'Authentication',
    dashboardPath: 'Authentication → Email Templates → Reset password',
  },
  'magic_link.html': {
    name: 'Magic link',
    category: 'Authentication',
    dashboardPath: 'Authentication → Email Templates → Magic link',
  },
  'email_change.html': {
    name: 'Change email address',
    category: 'Authentication',
    dashboardPath: 'Authentication → Email Templates → Change email address',
  },
  'invite.html': {
    name: 'Invite user',
    category: 'Authentication',
    dashboardPath: 'Authentication → Email Templates → Invite user',
  },
  'reauthentication.html': {
    name: 'Reauthentication',
    category: 'Authentication',
    dashboardPath: 'Authentication → Email Templates → Reauthentication',
  },
  'password_changed.html': {
    name: 'Password changed',
    category: 'Security',
    dashboardPath: 'Authentication → Email Templates → Security → Password changed',
  },
  'email_changed.html': {
    name: 'Email address changed',
    category: 'Security',
    dashboardPath: 'Authentication → Email Templates → Security → Email address changed',
  },
  'phone_changed.html': {
    name: 'Phone number changed',
    category: 'Security',
    dashboardPath: 'Authentication → Email Templates → Security → Phone number changed',
  },
  'mfa_enrolled.html': {
    name: 'Multi-factor authentication method added',
    category: 'Security',
    dashboardPath: 'Authentication → Email Templates → Security → Multi-factor authentication method added',
  },
  'mfa_unenrolled.html': {
    name: 'Multi-factor authentication method removed',
    category: 'Security',
    dashboardPath: 'Authentication → Email Templates → Security → Multi-factor authentication method removed',
  },
  'identity_linked.html': {
    name: 'Identity linked',
    category: 'Security',
    dashboardPath: 'Authentication → Email Templates → Security → Identity linked',
  },
  'identity_unlinked.html': {
    name: 'Identity unlinked',
    category: 'Security',
    dashboardPath: 'Authentication → Email Templates → Security → Identity unlinked',
  },
} as const;

console.log('\n🚀 Generating Template Copy Files...\n');

const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'));
let generatedCount = 0;

for (const file of files.sort()) {
  const info = TEMPLATE_INFO[file as keyof typeof TEMPLATE_INFO];
  if (!info) {
    console.warn(`⚠️  Skipping ${file} - unknown template type`);
    continue;
  }

  const filePath = path.join(templatesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Create HTML file with template content ready to copy
  const outputFile = path.join(outputDir, `${file.replace('.html', '')}.html`);
  
  // Create a clean HTML file with just the template content
  fs.writeFileSync(outputFile, content, 'utf-8');
  
  // Also create a markdown instruction file
  const mdFile = path.join(outputDir, `${file.replace('.html', '')}.md`);
  const mdContent = `# ${info.name}

**Category**: ${info.category}
**File**: \`${file}\`

## Deployment Steps

1. Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/auth/templates
2. Navigate to: **${info.dashboardPath}**
3. Open the HTML file: \`${file.replace('.html', '')}.html\`
4. Copy ALL content (Ctrl+A, Ctrl+C)
5. Paste into Supabase Dashboard template editor
6. Save

## Template Content

\`\`\`html
${content}
\`\`\`
`;

  fs.writeFileSync(mdFile, mdContent, 'utf-8');
  generatedCount++;
  console.log(`✅ Generated: ${file.replace('.html', '')}.html + .md`);
}

// Create index file
const indexContent = `# Supabase Email Templates - Deployment Guide

**Project**: ${PROJECT_REF}
**Date**: ${new Date().toISOString().split('T')[0]}

## Quick Start

1. Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/auth/templates
2. Copy templates from the files in this directory

## Authentication Templates

${Object.entries(TEMPLATE_INFO)
  .filter(([_, info]) => info.category === 'Authentication')
  .map(([file, info]) => `- [ ] **${info.name}** → \`${file.replace('.html', '')}.html\``)
  .join('\n')}

## Security Templates

${Object.entries(TEMPLATE_INFO)
  .filter(([_, info]) => info.category === 'Security')
  .map(([file, info]) => `- [ ] **${info.name}** → \`${file.replace('.html', '')}.html\``)
  .join('\n')}

## Files Generated

Each template has two files:
- \`.html\` - Template content (copy this)
- \`.md\` - Instructions (reference only)

## Notes

- Open \`.html\` files in a text editor
- Copy all content (Ctrl+A, Ctrl+C)
- Paste into Supabase Dashboard
- Save after each template
`;

fs.writeFileSync(path.join(outputDir, 'README.md'), indexContent, 'utf-8');

console.log(`\n✅ Generated ${generatedCount} template pairs`);
console.log(`📁 Output directory: ${outputDir}`);
console.log('\n📋 Next Steps:');
console.log(`   1. Open files in: ${outputDir}`);
console.log('   2. Copy HTML content from each .html file');
console.log('   3. Paste into Supabase Dashboard → Authentication → Email Templates');
console.log('\n✅ Done!\n');

