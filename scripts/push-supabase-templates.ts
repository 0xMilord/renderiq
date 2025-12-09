#!/usr/bin/env tsx
/**
 * Push Supabase Email Templates
 * Attempts to use Management API, falls back to formatted output files
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_REF = 'ncfgivjhkvorikuebtrl';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEMPLATE_MAP = {
  'confirmation.html': {
    type: 'confirmation',
    name: 'Confirm sign up',
    subject: 'Verify Your Email Address - Renderiq',
    endpoint: 'auth/templates/confirmation',
  },
  'recovery.html': {
    type: 'recovery',
    name: 'Reset password',
    subject: 'Reset Your Password - Renderiq',
    endpoint: 'auth/templates/recovery',
  },
  'magic_link.html': {
    type: 'magic_link',
    name: 'Magic link',
    subject: 'Your Magic Link - Renderiq',
    endpoint: 'auth/templates/magic_link',
  },
  'email_change.html': {
    type: 'email_change',
    name: 'Change email address',
    subject: 'Confirm Email Change - Renderiq',
    endpoint: 'auth/templates/email_change',
  },
  'invite.html': {
    type: 'invite',
    name: 'Invite user',
    subject: "You're Invited to Renderiq",
    endpoint: 'auth/templates/invite',
  },
  'reauthentication.html': {
    type: 'reauthentication',
    name: 'Reauthentication',
    subject: 'Confirm Reauthentication - Renderiq',
    endpoint: 'auth/templates/reauthentication',
  },
} as const;

async function pushTemplate(fileName: string, templateInfo: typeof TEMPLATE_MAP[keyof typeof TEMPLATE_MAP]) {
  const filePath = path.join(process.cwd(), 'supabase', 'templates', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Template file not found: ${fileName}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  if (!ACCESS_TOKEN) {
    console.warn(`⚠️  No access token - cannot push ${templateInfo.name} via API`);
    return false;
  }

  try {
    // Try Management API endpoint
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        [`email.template.${templateInfo.type}.content`]: content,
        [`email.template.${templateInfo.type}.subject`]: templateInfo.subject,
      }),
    });

    if (response.ok) {
      console.log(`✅ Pushed ${templateInfo.name} via API`);
      return true;
    } else {
      const errorText = await response.text();
      console.warn(`⚠️  API push failed for ${templateInfo.name}: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.warn(`⚠️  API error for ${templateInfo.name}:`, error);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Pushing Supabase Email Templates...\n');
  console.log(`📦 Project: ${PROJECT_REF}\n`);

  if (!ACCESS_TOKEN) {
    console.warn('⚠️  No SUPABASE_ACCESS_TOKEN found - will generate manual deployment files\n');
  }

  let successCount = 0;
  let manualCount = 0;

  // Create output directory for manual deployment files
  const outputDir = path.join(process.cwd(), 'supabase', 'templates-for-dashboard');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Process each template
  for (const [fileName, templateInfo] of Object.entries(TEMPLATE_MAP)) {
    const filePath = path.join(process.cwd(), 'supabase', 'templates', fileName);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Skipping ${fileName} - file not found`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Try API push
    if (ACCESS_TOKEN) {
      const pushed = await pushTemplate(fileName, templateInfo);
      if (pushed) {
        successCount++;
        continue;
      }
    }

    // Fallback: Create formatted file for manual deployment
    const outputFile = path.join(outputDir, `${templateInfo.type}.md`);
    const markdown = `# ${templateInfo.name}

**Template Type**: ${templateInfo.type}
**Subject**: ${templateInfo.subject}
**File**: ${fileName}

## Instructions

1. Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/auth/templates
2. Find template: **${templateInfo.name}**
3. Copy the HTML below and paste into the template editor
4. Update subject line if needed
5. Save

## HTML Content

\`\`\`html
${content}
\`\`\`
`;

    fs.writeFileSync(outputFile, markdown, 'utf-8');
    console.log(`📄 Created manual deployment file: ${outputFile}`);
    manualCount++;
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY:\n');
  console.log(`   ✅ Pushed via API: ${successCount}`);
  console.log(`   📄 Manual deployment files: ${manualCount}`);
  console.log(`\n📁 Manual files location: ${outputDir}`);
  
  if (manualCount > 0) {
    console.log('\n⚠️  NOTE: Supabase does not provide a public API for email templates.');
    console.log('   Please copy templates manually from the files above to the Dashboard.\n');
  }

  console.log('\n✅ Done!\n');
}

main().catch(console.error);

