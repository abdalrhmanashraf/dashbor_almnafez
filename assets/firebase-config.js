// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8EFPIUx4Mck2tvpdT-WZx4gFeP2gtfUg",
  authDomain: "dashbordalmnafez.firebaseapp.com",
  projectId: "dashbordalmnafez",
  storageBucket: "dashbordalmnafez.firebasestorage.app",
  messagingSenderId: "811835052385",
  appId: "1:811835052385:web:af180b6adf1fb9a8dcb520",
  measurementId: "G-SS49440C1Q"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
window.db = db;

// Sheet IDs
window.STATS_SHEET_ID = '12tWeZXJSyrO9j8SzhduSMqH9hC4aBs46cAK9RNNc14E';
window.FACILITIES_SHEET_ID = '1mi8-fp0DmvMi9MddQe6lMWCTArp22HvDNI9sf5xIOL0';

// Helper: Fetch all documents from a Firestore collection
window.fetchCollection = async function(collectionName) {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Helper: Fetch a single document
window.fetchDoc = async function(collectionName, docId) {
    const doc = await db.collection(collectionName).doc(docId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

// Fallback: Fetch from Google Sheets via JSONP (if Firestore is empty)
window.fetchFromGoogleSheet = function(sheetId, queryParam) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const cb = 'jsonp_' + Math.random().toString(36).substr(2, 9);
        
        const timeout = setTimeout(() => {
            delete window[cb];
            if (script.parentNode) script.parentNode.removeChild(script);
            reject(new Error('Timeout fetching sheet: ' + queryParam));
        }, 15000);

        window[cb] = function(data) {
            clearTimeout(timeout);
            delete window[cb];
            if (script.parentNode) script.parentNode.removeChild(script);
            
            if (data.status === 'error') return reject(data.errors);
            
            const cols = data.table.cols.map(c => c.label);
            const rows = data.table.rows.map(r => {
                const obj = {};
                r.c.forEach((cell, i) => {
                    if (!cols[i]) return;
                    obj[cols[i]] = cell ? (cell.v !== undefined && cell.v !== null ? cell.v : (cell.f || null)) : null;
                });
                return obj;
            });
            resolve(rows);
        };

        script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${cb}&${queryParam}`;
        script.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Script load failed'));
        };
        document.body.appendChild(script);
    });
};

console.log('🔥 Firebase initialized — Project: dashbordalmnafez');
