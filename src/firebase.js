const admin = require("firebase-admin");
require('dotenv').config();

const env = process.env
const serviceAccount = require(env.SERVICE_ACCOUNT_KEY_PATH);

// const serviceAccount = {
//   "type": "service_account",
//   "project_id": env.SA_PROJECT_ID,
//   "private_key_id": env.SA_PRIVATE_KEY_ID,
//   "private_key": env.SA_PRIVATE_KEY,
//   "client_email": env.SA_CLIENT_EMAIL,
//   "client_id": env.SA_CLIENT_ID,
//   "auth_uri": env.SA_AUTH_URI,
//   "token_uri": env.SA_TOKEN_URI,
//   "auth_provider_x509_cert_url": env.SA_AUTH_PROVIDER_X509_CERT_URL,
//   "client_x509_cert_url": env.SA_CLIENT_X509_CERT_URL
// }


// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://slack-attendance-check-default-rtdb.asia-southeast1.firebasedatabase.app"
});


module.exports = admin.database();
