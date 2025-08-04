// Firebase Configuration (Add to index.html before script.js)
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
    // Replace with your Firebase config
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Replace localStorage functions
window.saveToCloud = async (key, data) => {
    await setDoc(doc(db, 'titlePlanner', key), { data });
};

window.loadFromCloud = async (key) => {
    const docSnap = await getDoc(doc(db, 'titlePlanner', key));
    return docSnap.exists() ? docSnap.data().data : null;
};

// Real-time sync
window.syncData = (key, callback) => {
    onSnapshot(doc(db, 'titlePlanner', key), (doc) => {
        if (doc.exists()) callback(doc.data().data);
    });
};