import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDix_z2aZrR1270ElWlMkrWxkj_FKBDQTY",
  authDomain: "jv-ortopedia.firebaseapp.com",
  projectId: "jv-ortopedia",
  storageBucket: "jv-ortopedia.firebasestorage.app",
  messagingSenderId: "662602185527",
  appId: "1:662602185527:web:52c55adb755431f1d0b8b2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
