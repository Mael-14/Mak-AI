import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDfHWMNiHJYrq-K42-B4Ye5KiBtgBTg7So",
  authDomain: "mak-ai-adad4.firebaseapp.com",
  projectId: "mak-ai-adad4",
  storageBucket: "mak-ai-adad4.firebasestorage.app",
  messagingSenderId: "105135377020",
  appId: "1:105135377020:web:afebcb88df664bd712d7f9",
  measurementId: "G-DRLEJ3HG4Q"
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}
//const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);