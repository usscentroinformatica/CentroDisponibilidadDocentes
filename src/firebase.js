// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6a4L_ifuIix6LAHmT4_B3LzwGThJqsCs",
  authDomain: "registro-docente-5ea97.firebaseapp.com",
  projectId: "registro-docente-5ea97",
  storageBucket: "registro-docente-5ea97.firebasestorage.app",
  messagingSenderId: "253062083501",
  appId: "1:253062083501:web:ba4b767fb6ef8e8982e724"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
