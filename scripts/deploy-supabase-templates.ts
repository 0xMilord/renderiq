#!/usr/bin/env tsx
/**
 * Deploy Supabase Email Templates
 * 
 * This script reads all email templates from supabase/templates/
 * and deploys them to Supabase using the Management API
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  process.exit(1);
}

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  console.error('   Note: You need a Supabase Access Token from https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

// Template mapping: file name -> Supabase template type
const TEMPLATE_MAP = {
  'confirmation.html': 'confirmation',
  'recovery.html': 'recovery',
  'magic_link.html': 'magic_link',
  'email_change.html': 'email_change',
  'invite.html': 'invite',
  'reauthentication.html': 'reauthentication',
  'password_changed.html': 'password_changed',
  'email_changed.html': 'email_changed',
  'phone_changed.html': 'phone_changed',
  'mfa_enrolled.html': 'mfa_factor_enrolled',
  'mfa_unenrolled.html': 'mfa_factor_unenrolled',
  'identity_linked.html': 'identity_linked',
  'identity_unlinked.html': 'identity_unlinked',
} as const;

// Subject lines
const SUBJECTS: Record<string, string> = {
  confirmation: 'Verify Your Email Address - Renderiq',
  recovery: 'Reset Your Password - Renderiq',
  magic_link: 'Your Magic Link - Renderiq',
  email_change: 'Confirm Email Change - Renderiq',
  invite: "You're Invited to Renderiq",
  reauthentication: 'Confirm Reauthentication - Renderiq',
  password_changed: 'Password Changed - Renderiq',
  email_changed: 'Email Address Changed - Renderiq',
  phone_changed: 'Phone Number Changed - Renderiq',
  mfa_factor_enrolled: 'Multi-Factor Authentication Added - Renderiq',
  mfa_factor_unenrolled: 'Multi-Factor Authentication Removed - Renderiq',
  identity_linked: 'New Account Linked - Renderiq',
  identity_unlinked: 'Account Unlinked - Renderiq',
};

async function deployTemplates() {
  console.log('🚀 Starting Supabase Email Templates Deployment...\n');

  const templatesDir = path.join(process.cwd(), 'supabase', 'templates');
  
  if (!fs.existsSync(templatesDir)) {
    console.error(`❌ Error: Templates directory not found: ${templatesDir}`);
    process.exit(1);
  }

  // Read all template files
  const templateFiles = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'));
  
  if (templateFiles.length === 0) {
    console.error('❌ Error: No template files found in supabase/templates/');
    process.exit(1);
  }

  console.log(`📋 Found ${templateFiles.length} template files\n`);

  // Generate deployment instructions
  console.log('⚠️  IMPORTANT: Supabase does not provide an API to update email templates.');
  console.log('   Templates must be manually copied to the Dashboard.\n');
  console.log('📝 DEPLOYMENT INSTRUCTIONS:\n');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log(`2. Select project: ${SUPABASE_URL.split('//')[1].split('.')[0]}`);
  console.log('3. Navigate to: Authentication → Email Templates\n');
  console.log('4. Copy each template below:\n');
  console.log('=' .repeat(80));

  for (const file of templateFiles.sort()) {
    const templateType = TEMPLATE_MAP[file as keyof typeof TEMPLATE_MAP];
    
    if (!templateType) {
      console.warn(`⚠️  Warning: Unknown template type for ${file}, skipping...`);
      continue;
    }

    const filePath = path.join(templatesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const subject = SUBJECTS[templateType] || 'Renderiq';

    console.log('\n');
    console.log('─'.repeat(80));
    console.log(`📧 TEMPLATE: ${templateType.toUpperCase()}`);
    console.log(`📁 File: ${file}`);
    console.log(`📌 Subject: ${subject}`);
    console.log('─'.repeat(80));
    console.log('\n👉 Copy the HTML below and paste into Dashboard:\n');
    console.log(content);
    console.log('\n' + '='.repeat(80));
  }

  console.log('\n✅ All templates prepared!');
  console.log('\n📋 QUICK CHECKLIST:');
  console.log('   [ ] Confirmation (signup)');
  console.log('   [ ] Recovery (password reset)');
  console.log('   [ ] Magic link');
  console.log('   [ ] Email change');
  console.log('   [ ] Invite');
  console.log('   [ ] Reauthentication');
  console.log('   [ ] Password changed (Security tab)');
  console.log('   [ ] Email changed (Security tab)');
  console.log('   [ ] Phone changed (Security tab)');
  console.log('   [ ] MFA enrolled (Security tab)');
  console.log('   [ ] MFA unenrolled (Security tab)');
  console.log('   [ ] Identity linked (Security tab)');
  console.log('   [ ] Identity unlinked (Security tab)');
  console.log('\n💡 Tip: Use Ctrl+F to search in Dashboard for template names');
}

deployTemplates().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

