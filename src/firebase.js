const admin = require("firebase-admin");
require('dotenv').config();

const env = process.env

const serviceAccount = {
  "type": "service_account",
  "project_id": env.SA_PROJECT_ID,
  "private_key_id": env.SA_PRIVATE_KEY_ID,
  "private_key": env.SA_PRIVATE_KEY.replace(/\\n/g, "\n"),
  "client_email": env.SA_CLIENT_EMAIL,
  "client_id": env.SA_CLIENT_ID,
  "auth_uri": env.SA_AUTH_URI,
  "token_uri": env.SA_TOKEN_URI,
  "auth_provider_x509_cert_url": env.SA_AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": env.SA_CLIENT_X509_CERT_URL
}

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://slack-attendance-check-default-rtdb.asia-southeast1.firebasedatabase.app"
});


module.exports = admin.database();

const fireStore = admin.firestore();

async function test() {
  const ref = db.collection("schedules");
  const snapshot = await ref.get();
  return snapshot.docs.map(s => s.data());
}

async function main() {
  console.log(`***** START MAIN *****`);
  const users = await test();
  users.forEach((v) => console.log(`user=${JSON.stringify(v)}`))
  console.log(`***** END   MAIN *****`);
}

main().then();


