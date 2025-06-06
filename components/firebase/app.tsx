import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';

const certObject: any = {
  type: 'service_account',
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY?.replace(/\\n/gm, "\n"),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: 'googleapis.com'
}

const getFirebaseAppInstance = () => {
  if (!getApps().length) {
    initializeApp({
      credential: cert(certObject),
    });
  }
  console.log(process.env.CLIENT_EMAIL);
  return getApp();
}

export default getFirebaseAppInstance;
