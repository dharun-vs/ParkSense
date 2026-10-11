/**
 * PARKSENSE — DEMO ACCOUNT PROVISIONING SCRIPT
 * 
 * Safely provisions the required demo accounts (admin / customer) in Supabase Auth
 * using the server-side Supabase Auth Admin API.
 * 
 * Usage:
 *   node scripts/provision-demo-accounts.mjs <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>
 * 
 * Or set environment variables:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/provision-demo-accounts.mjs
 * 
 * Note: Never expose the SERVICE_ROLE_KEY in frontend code or Git commits!
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.argv[2] || process.env.SUPABASE_URL
const serviceRoleKey = process.argv[3] || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.log(`
========================================================================
PARKSENSE — DEMO ACCOUNT PROVISIONING TOOL
========================================================================
Missing required Supabase service-role credentials.

To securely provision the academic demo accounts in your Supabase project:
Run:
  node scripts/provision-demo-accounts.mjs <YOUR_SUPABASE_URL> <YOUR_SERVICE_ROLE_KEY>

Where:
  1. YOUR_SUPABASE_URL: from Supabase Dashboard > Project Settings > API
  2. YOUR_SERVICE_ROLE_KEY: from Supabase Dashboard > Project Settings > API (service_role secret)

Alternatively, apply the SQL migration directly in Supabase SQL Editor:
  supabase/migrations/20261010000001_add_username_and_demo_accounts.sql
========================================================================
`)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const ACCOUNTS = [
  {
    email: 'admin@parksense.demo',
    password: 'admin',
    displayName: 'System Administrator',
    username: 'admin',
    role: 'admin',
  },
  {
    email: 'customer@parksense.demo',
    password: '1234',
    displayName: 'Demo Driver',
    username: 'customer',
    role: 'user',
  },
]

async function provision() {
  console.log('🔄 Connecting to Supabase project...')

  for (const acc of ACCOUNTS) {
    console.log(`\n📌 Processing account: ${acc.email} (Username: ${acc.username})...`)

    // Check if user already exists
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.error(`❌ Failed to list users: ${listError.message}`)
      continue
    }

    let existingUser = listData.users.find((u) => u.email === acc.email)

    if (!existingUser) {
      console.log(`   Creating auth user in Supabase Auth...`)
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          display_name: acc.displayName,
          username: acc.username,
        },
      })

      if (createError) {
        console.error(`❌ Failed to create auth user: ${createError.message}`)
        continue
      }
      existingUser = createData.user
      console.log(`   ✅ Auth user created successfully (ID: ${existingUser.id})`)
    } else {
      console.log(`   User already exists in Auth (ID: ${existingUser.id}). Updating password & metadata...`)
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          display_name: acc.displayName,
          username: acc.username,
        },
      })
      if (updateError) {
        console.error(`❌ Failed to update user: ${updateError.message}`)
      } else {
        console.log(`   ✅ Auth user updated.`)
      }
    }

    // Ensure role is assigned properly in profiles table
    console.log(`   Assigning role '${acc.role}' in public.profiles...`)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: existingUser.id,
        display_name: acc.displayName,
        username: acc.username,
        role: acc.role,
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error(`❌ Failed to update profile table: ${profileError.message}`)
    } else {
      console.log(`   ✅ Profile linked with role: ${acc.role}`)
    }
  }

  console.log(`\n🎉 Demo accounts provisioning complete!`)
  console.log(`Admin login:    username 'admin'    / password 'admin'    -> role 'admin'`)
  console.log(`Customer login: username 'customer' / password '1234'     -> role 'user'\n`)
}

provision().catch((err) => {
  console.error('Fatal error during provisioning:', err)
  process.exit(1)
})
