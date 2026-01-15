import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBY--lullQ_o4akQuUxcVVH32uwFPbkz1c",
  authDomain: "ecommerce-7be71.firebaseapp.com",
  projectId: "ecommerce-7be71",
  storageBucket: "ecommerce-7be71.appspot.com",
  messagingSenderId: "1024356890245",
  appId: "1:1024356890245:web:8a8a8a8a8a8a8a8a8a8a8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);