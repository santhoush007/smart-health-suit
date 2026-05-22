import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAy3fGyVYoh4bTVt4Xc7w0R8DyQV786b-o",
  authDomain: "intelligent-smart-health-suit.firebaseapp.com",
  databaseURL: "https://intelligent-smart-health-suit-default-rtdb.firebaseio.com",
  projectId: "intelligent-smart-health-suit",
  storageBucket: "intelligent-smart-health-suit.firebasestorage.app",
  messagingSenderId: "727314396243",
  appId: "1:727314396243:web:f3f5bf3706695c376342a6",
  measurementId: "G-YRNCSQCHFF"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);