import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

async function runTests() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const envVars: Record<string, string> = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) envVars[match[1]] = match[2].trim();
  });

  const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];
  
  const projectRef = supabaseUrl.split('://')[1].split('.')[0];

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  
  await serviceClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { free_ai_uses_remaining: 10 }
  });
  
  const authClient = createClient(supabaseUrl, envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']);
  const { data: sessionData } = await authClient.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  const session = sessionData.session!;
  
  // Construct the Supabase cookie:
  const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`;
  const cookieHeader = `sb-${projectRef}-auth-token=${cookieValue}`;

  const jobDesc = `
  Acme Corp is hiring a Frontend Engineer to build modern web apps. We offer competitive pay of ₱60,000-₱90,000. You'll use React, TypeScript, and TailwindCSS to build features. The ideal candidate is a team player who must be willing to work in our office in BGC, Taguig at least 3 days a week.
  `;

  async function testExtract(customCookie?: string) {
    const res = await fetch('http://localhost:3000/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': customCookie || cookieHeader
      },
      body: JSON.stringify({ jobDescription: jobDesc })
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  const { error: profileErr, data: profileData } = await serviceClient.from('profiles').upsert({ id: session.user.id, full_name: 'Test User', free_ai_uses_remaining: 100, preferred_provider: 'google' }).select().single();
  if (profileErr) console.error("Profile upsert error:", profileErr);
  console.log("Updated profile:", profileData?.free_ai_uses_remaining);

  // Clear any existing limits for today to ensure a clean slate
  await serviceClient.from('ai_model_usage').delete().neq('model_name', 'nothing');


  console.log("\n=== TEST 1: Baseline Extraction ===");
  const res1 = await testExtract();
  console.log(`Status: ${res1.status}`);
  if (res1.status === 422) console.log("Details:", res1.data);
  console.log(`Model Used: ${res1.data?.model_used}`);

  // Test 2: Exhaust gemini models
  console.log("\n=== TEST 2: Fallback Chain ===");
  // We can just block the primary gemini model to trigger fallback
  await serviceClient.from('ai_model_usage').upsert({
    model_name: 'gemini-3.5-flash',
    date: new Date().toISOString().split('T')[0],
    request_count: 50000, // max limit
    blocked_until: new Date(Date.now() + 100000).toISOString()
  });
  const res2 = await testExtract();
  console.log(`Status: ${res2.status}`);
  if (res2.status === 422) console.log("Details:", res2.data);
  console.log(`Model Used: ${res2.data?.model_used}`);

  // Test 3: Complete exhaustion
  console.log("\n=== TEST 2.5: Fallback to Groq ===");
  // Simulate ALL Gemini models being blocked
  await serviceClient.from('ai_model_usage').upsert([
    {
      model_name: 'gemini-3.5-flash',
      date: new Date().toISOString().split('T')[0],
      request_count: 50000,
      blocked_until: new Date(Date.now() + 100000).toISOString()
    },
    {
      model_name: 'gemini-3-flash-preview',
      date: new Date().toISOString().split('T')[0],
      request_count: 50000,
      blocked_until: new Date(Date.now() + 100000).toISOString()
    },
    {
      model_name: 'gemini-3.1-flash-lite-preview',
      date: new Date().toISOString().split('T')[0],
      request_count: 50000,
      blocked_until: new Date(Date.now() + 100000).toISOString()
    }
  ]);

  const res25 = await testExtract();
  console.log(`Status: ${res25.status}`);
  if (res25.status === 200) {
    console.log(`Model Used: ${res25.data?.model_used}`);
    console.log("Data Output:");
    console.log(JSON.stringify(res25.data?.data, null, 2));
  } else {
    console.log("Details:", res25.data);
  }

  console.log("\n=== TEST 2.6: Fallback to Groq (Junk Input) ===");
  const junkJobDesc = `This is a recipe for a banana cake. To bake a banana cake, you need to mash 3 ripe bananas, add 2 cups of flour, 1 cup of sugar, and bake at 350 degrees for 40 minutes. Enjoy your delicious dessert! It is very tasty and sweet and everyone loves it so much especially the kids. It has absolutely nothing to do with any jobs or employment.`;
  const res26 = await fetch('http://localhost:3000/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
    body: JSON.stringify({ jobDescription: junkJobDesc })
  });
  const data26 = await res26.json().catch(() => null);
  console.log(`Status: ${res26.status}`);
  if (res26.status === 200 || res26.status === 422) {
    console.log(`Model Used: ${data26?.model_used}`);
    console.log("Details/Data Output:");
    console.log(JSON.stringify(data26, null, 2));
  } else {
    console.log("Details:", data26);
  }

  console.log("\n=== TEST 3: Complete Exhaustion ===");
  await serviceClient.from('ai_model_usage').upsert([
    {
      model_name: 'gemini-3.5-flash',
      date: new Date().toISOString().split('T')[0],
      request_count: 50000,
      blocked_until: new Date(Date.now() + 100000).toISOString()
    },
    {
      model_name: 'gemini-3-flash-preview',
      date: new Date().toISOString().split('T')[0],
      request_count: 50000,
      blocked_until: new Date(Date.now() + 100000).toISOString()
    },
    {
      model_name: 'gemini-3.1-flash-lite-preview',
      date: new Date().toISOString().split('T')[0],
      request_count: 50000,
      blocked_until: new Date(Date.now() + 100000).toISOString()
    },
    {
      model_name: 'groq:shared-bucket',
      date: new Date().toISOString().split('T')[0],
      request_count: 50000,
      blocked_until: new Date(Date.now() + 100000).toISOString()
    }
  ]);
  const res3 = await testExtract();
  console.log(`Status: ${res3.status}`);
  console.log(`Error: ${res3.data?.error}`);
  console.log(`Retry After: ${res3.data?.retryAfterSeconds}`);

  // Test 4: BYOK Gemini-Only request
  console.log("\n=== TEST 4: BYOK Gemini ===");
  // Set preferred_provider and key for the user
  const { data: byokUser } = await serviceClient.auth.admin.createUser({
    email: `byok_${Date.now()}@example.com`,
    password: testPassword,
    email_confirm: true
  });
  
  await serviceClient.from('profiles').upsert({ id: byokUser!.user!.id, full_name: 'Test BYOK', preferred_provider: 'google', free_ai_uses_remaining: 100 });
  // Just pass an invalid key to see if it routes to BYOK google (expect 401 custom key error)
  // Or since I can't encrypt it easily, I'll just check if it gets a 401 instead of 429
  // Wait, I can't easily encrypt the key here using the exact logic, because of IVs and auth tags.
  // Actually, I can use a real google key and encrypt it! 
  // Let me just manually copy a valid encrypted key from another user if possible.
  // Or I can skip testing the actual encryption and just see if the error is 401 (if the user has an invalid key). But wait, `hasCustomKey` only becomes true if decryption succeeds.
  // We can write a quick encrypt function.
  const crypto = await import('crypto');
  const encrypt = (text: string) => {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(envVars['BYOK_ENCRYPTION_KEY'] || '01234567890123456789012345678901', 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
      encrypted_key: encrypted,
      iv: iv.toString('hex'),
      auth_tag: cipher.getAuthTag().toString('hex')
    };
  };

  const encrypted = encrypt(envVars['GEMINI_API_KEY']);
  await serviceClient.from('user_api_keys').insert({
    user_id: byokUser!.user!.id,
    provider: 'google',
    ...encrypted
  });

  const { data: sessionDataByok } = await authClient.auth.signInWithPassword({
    email: byokUser!.user!.email as string,
    password: testPassword
  });
  const cookieValueByok = `base64-${Buffer.from(JSON.stringify(sessionDataByok.session)).toString('base64')}`;
  const cookieHeaderByok = `sb-${projectRef}-auth-token=${cookieValueByok}`;

  const res4 = await testExtract(cookieHeaderByok);
  console.log(`Status: ${res4.status}`);
  console.log(`Model Used: ${res4.data?.model_used}`);

}

runTests().catch(console.error);
