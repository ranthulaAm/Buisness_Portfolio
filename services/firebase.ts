import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { initializeFirestore, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC6fNMDIhcs0lqfvM3Nq57GIUwrXAuUlbk",
  authDomain: typeof window !== 'undefined' ? window.location.hostname : "ragraphics-app.firebaseapp.com",
  projectId: "ragraphics-app",
  storageBucket: "ragraphics-app.firebasestorage.app",
  messagingSenderId: "1091662698201",
  appId: "1:1091662698201:web:f7ea1241395e78834b90c8",
  measurementId: "G-D0B08B4R56"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Set Firestore log level to error to suppress transport-related warning spam in sandboxed environments
setLogLevel('error');

// Force long-polling as streaming channels can be unstable/blocked within sandboxed iframe containers
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);