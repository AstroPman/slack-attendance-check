const admin = require("firebase-admin");
const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY_PATH);

require('dotenv').config();


// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://slack-attendance-check-default-rtdb.asia-southeast1.firebasedatabase.app"
});


module.exports = admin.database();
