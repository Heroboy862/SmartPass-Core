import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Safe import of gitignored config using Vite's eager glob import mapped through standard type bypass.
// This prevents compilation and bundler failures on GitHub (CI) where the config file is not committed.
const configs: Record<string, any> = (import.meta as any).glob("../firebase-applet-config.json", { eager: true });
const configPaths = Object.keys(configs);

const firebaseConfig = configPaths.length > 0 
  ? configs[configPaths[0]].default 
  : {
      apiKey: "dummy-fallback-key-for-ci",
      authDomain: "dummy-fallback.firebaseapp.com",
      projectId: "dummy-fallback",
      storageBucket: "dummy-fallback.appspot.com",
      messagingSenderId: "000000000000",
      appId: "1:000000000000:web:0000000000000000000000",
      firestoreDatabaseId: "(default)"
    };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
