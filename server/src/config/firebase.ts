import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
let firebaseInitialized = false;
let devMode = false;

// Check if we should use DEV MODE
if (!serviceAccountPath) {
    devMode = true;
    console.warn('⚠️  DEV MODE: FIREBASE_SERVICE_ACCOUNT_JSON not set');
    console.warn('   Using development auth bypass');
} else {
    const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);

    if (!fs.existsSync(resolvedPath)) {
        devMode = true;
        console.warn(`⚠️  DEV MODE: Service account file not found at: ${resolvedPath}`);
        console.warn('   Using development auth bypass');
    } else {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });

            firebaseInitialized = true;
            console.log('✅ Firebase Admin initialized successfully');
        } catch (error) {
            devMode = true;
            console.error('❌ Failed to initialize Firebase Admin:', error);
            console.warn('   Falling back to DEV MODE');
        }
    }
}

if (devMode) {
    console.log('');
    console.log('📋 DEV MODE ACTIVE:');
    console.log('   - All authenticated requests will use "dev_user" account');
    console.log('   - To enable real auth, provide a valid service-account.json');
    console.log('');
}

export const firebaseAuth = firebaseInitialized ? admin.auth() : null;
export const isDevMode = devMode;
