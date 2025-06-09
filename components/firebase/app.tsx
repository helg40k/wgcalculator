import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";

const certObject: any = {
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  private_key: process.env.PRIVATE_KEY?.replace(/\\n/gm, "\n"),
  private_key_id: process.env.PRIVATE_KEY_ID,
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  token_uri: "https://oauth2.googleapis.com/token",
  type: "service_account",
  universe_domain: "googleapis.com",
};

const getFirebaseAppInstance = () => {
  if (!getApps().length) {
    initializeApp({
      credential: cert(certObject),
    });
  }
  console.log(process.env.CLIENT_EMAIL);
  return getApp();
};

export default getFirebaseAppInstance;
