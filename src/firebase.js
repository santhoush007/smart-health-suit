import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "xxxxxxxx",
  authDomain: "xxxxxxxxxx",
  databaseURL: "xxxxxxxxxxx",
  projectId: "xxxxxxxx",
  storageBucket: "xxxxxx",
  messagingSenderId: "xxxxxxxx",
  appId: "xxxxxxxxxx",
  measurementId: "xxxxxxxxx"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);