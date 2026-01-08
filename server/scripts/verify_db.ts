
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Key:', supabaseKey ? 'Set' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('--- DATABASE DIAGNOSTIC ---');
    console.log('Checking connection to:', supabaseUrl);

    // 1. Check Users
    const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (userError) {
        console.error('❌ Error checking users:', userError.message);
    } else {
        console.log('✅ Users found:', userCount);
    }

    // 2. Check Theories
    const { count: theoryCount, error: theoryError } = await supabase
        .from('theories')
        .select('*', { count: 'exact', head: true });

    if (theoryError) {
        console.error('❌ Error checking theories:', theoryError.message);
    } else {
        console.log('✅ Theories found:', theoryCount);
    }

    // 3. Check for 'role' column in users
    const { data: userData, error: dataError } = await supabase
        .from('users')
        .select('role')
        .limit(1);

    if (dataError) {
        console.error('❌ Error selecting role column:', dataError.message);
    } else {
        console.log('✅ Role column exists. Sample:', userData);
    }

    console.log('--- END DIAGNOSTIC ---');
}

checkDatabase().catch(console.error);
