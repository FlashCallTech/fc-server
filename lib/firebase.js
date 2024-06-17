
import {getAuth} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


import { initializeApp } from "firebase/app";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_KEY,
  authDomain: "flashcallchat.firebaseapp.com",
  projectId: "flashcallchat",
  storageBucket: "flashcallchat.appspot.com",
  messagingSenderId: "789413051138",
  appId: "1:789413051138:web:6f9c2dbc4b48a5f1d4e01b",
  measurementId: "G-KE1QPLVC2Z"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();

