import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC5Hhbgo9OmedWZY9ggpK0p8M2qqMOv0UQ",
  authDomain: "policysetu-96deb.firebaseapp.com",
  projectId: "policysetu-96deb",
  storageBucket: "policysetu-96deb.firebasestorage.app",
  messagingSenderId: "584019781763",
  appId: "1:584019781763:web:87eaaa609d7637368493b6",
  measurementId: "G-27MZM8MFR3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
