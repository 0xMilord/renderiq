#!/usr/bin/env tsx
/**
 * Simple Script to Display Templates for Manual Deployment
 * Run: npm run deploy:templates
 */

import * as fs from 'fs';
import * as path from 'path';

const templatesDir = path.join(process.cwd(), 'supabase', 'templates');

const TEMPLATE_INFO = {
  'confirmation.html': {
    name: 'Confirm sign up',
    subject: 'Verify Your Email Address - Renderiq',
    category: 'Authentication',
  },
  'recovery.html': {
    name: 'Reset password',
    subject: 'Reset Your Password - Renderiq',
    category: 'Authentication',
  },
  'magic_link.html': {
    name: 'Magic link',
    subject: 'Your Magic Link - Renderiq',
    category: 'Authentication',
  },
  'email_change.html': {
    name: 'Change email address',
    subject: 'Confirm Email Change - Renderiq',
    category: 'Authentication',
  },
  'invite.html': {
    name: 'Invite user',
    subject: "You're Invited to Renderiq",
    category: 'Authentication',
  },
  'reauthentication.html': {
    name: 'Reauthentication',
    subject: 'Confirm Reauthentication - Renderiq',
    category: 'Authentication',
  },
  'password_changed.html': {
    name: 'Password changed',
    subject: 'Password Changed - Renderiq',
    category: 'Security',
  },
  'email_changed.html': {
    name: 'Email address changed',
    subject: 'Email Address Changed - Renderiq',
    category: 'Security',
  },
  'phone_changed.html': {
    name: 'Phone number changed',
    subject: 'Phone Number Changed - Renderiq',
    category: 'Security',
  },
  'mfa_enrolled.html': {
    name: 'Multi-factor authentication method added',
    subject: 'Multi-Factor Authentication Added - Renderiq',
    category: 'Security',
  },
  'mfa_unenrolled.html': {
    name: 'Multi-factor authentication method removed',
    subject: 'Multi-Factor Authentication Removed - Renderiq',
    category: 'Security',
  },
  'identity_linked.html': {
    name: 'Identity linked',
    subject: 'New Account Linked - Renderiq',
    category: 'Security',
  },
  'identity_unlinked.html': {
    name: 'Identity unlinked',
    subject: 'Account Unlinked - Renderiq',
    category: 'Security',
  },
} as const;

console.log('\n🚀 SUPABASE EMAIL TEMPLATES DEPLOYMENT\n');
console.log('='.repeat(80));
console.log('\n⚠️  NOTE: Supabase requires manual template deployment via Dashboard');
console.log('   There is no API endpoint for updating email templates.\n');
console.log('📝 STEPS:\n');
console.log('1. Go to: https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to: Authentication → Email Templates');
console.log('4. Copy templates below (organized by category)\n');
console.log('='.repeat(80));

// Group by category
const byCategory = {
  Authentication: [] as string[],
  Security: [] as string[],
};

for (const file of Object.keys(TEMPLATE_INFO)) {
  const info = TEMPLATE_INFO[file as keyof typeof TEMPLATE_INFO];
  if (info) {
    byCategory[info.category].push(file);
  }
}

// Display Authentication templates
console.log('\n\n📧 AUTHENTICATION TEMPLATES\n');
console.log('─'.repeat(80));

for (const file of byCategory.Authentication.sort()) {
  const info = TEMPLATE_INFO[file as keyof typeof TEMPLATE_INFO];
  if (!info) continue;

  const filePath = path.join(templatesDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Warning: ${file} not found`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  
  console.log(`\n\n✅ TEMPLATE: ${info.name}`);
  console.log(`📁 File: ${file}`);
  console.log(`📌 Subject: ${info.subject}`);
  console.log(`📍 Location in Dashboard: Authentication → Email Templates → ${info.name}`);
  console.log('\n📋 HTML CONTENT (copy all):');
  console.log('─'.repeat(80));
  console.log(content);
  console.log('─'.repeat(80));
}

// Display Security templates
console.log('\n\n\n🔒 SECURITY TEMPLATES\n');
console.log('─'.repeat(80));
console.log('📍 Location in Dashboard: Authentication → Email Templates → Security tab\n');

for (const file of byCategory.Security.sort()) {
  const info = TEMPLATE_INFO[file as keyof typeof TEMPLATE_INFO];
  if (!info) continue;

  const filePath = path.join(templatesDir, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Warning: ${file} not found`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  
  console.log(`\n\n✅ TEMPLATE: ${info.name}`);
  console.log(`📁 File: ${file}`);
  console.log(`📌 Subject: ${info.subject}`);
  console.log('\n📋 HTML CONTENT (copy all):');
  console.log('─'.repeat(80));
  console.log(content);
  console.log('─'.repeat(80));
}

console.log('\n\n✅ ALL TEMPLATES READY FOR DEPLOYMENT!\n');
console.log('📋 Deployment Checklist:');
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
console.log('\n');

