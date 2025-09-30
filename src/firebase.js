// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCn6FdpZzAbfjDY2IpkFBtHxQw0bqJoFSc",
  authDomain: "reuniones-docentes.firebaseapp.com",
  projectId: "reuniones-docentes",
  storageBucket: "reuniones-docentes.firebasestorage.app",
  messagingSenderId: "1003271619029",
  appId: "1:1003271619029:web:bfbb4a80dcca17c2637d5c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
