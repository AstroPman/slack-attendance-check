const firebase = require("firebase-admin");
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
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://slack-attendance-check-default-rtdb.asia-southeast1.firebasedatabase.app"
});

exports.firebase = firebase
// exports.db = firebase.database();
// exports.fireStore = firebase.firestore();