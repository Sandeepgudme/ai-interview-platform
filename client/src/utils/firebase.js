
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBpwSW9Y6y1Ozu1szYIuQH8h2FWOeBdNvM",
  authDomain: "ai-ipp.firebaseapp.com",
  projectId: "ai-ipp",
  storageBucket: "ai-ipp.firebasestorage.app",
  messagingSenderId: "727061648503",
  appId: "1:727061648503:web:be03249877900afb49e272",
  measurementId: "G-JFMM2HCK9W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { auth, provider };