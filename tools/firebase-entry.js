export { initializeApp } from 'firebase/app';
export { getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut,
         indexedDBLocalPersistence, browserLocalPersistence, initializeAuth,
         EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
export { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, doc, onSnapshot,
         setDoc, serverTimestamp, terminate, clearIndexedDbPersistence,
         collection, addDoc, getDocs, getDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
