import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
   apiKey: "AIzaSyCxGo0sehGZQAt_guUNlNsdjaDrf5sm2F0",
  authDomain: "admin-panel-38023.firebaseapp.com",
  projectId: "admin-panel-38023",
  storageBucket: "admin-panel-38023.firebasestorage.app",
  messagingSenderId: "229090395918",
  appId: "1:229090395918:web:9cbc7c76f8e17686c4395f",
  measurementId: "G-XN6R1YCLKJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
