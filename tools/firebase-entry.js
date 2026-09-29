export { initializeApp } from 'firebase/app';
export { getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut,
         indexedDBLocalPersistence, browserLocalPersistence, initializeAuth } from 'firebase/auth';
export { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, doc, onSnapshot,
         setDoc, serverTimestamp, terminate, clearIndexedDbPersistence } from 'firebase/firestore';
