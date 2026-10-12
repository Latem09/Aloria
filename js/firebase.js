import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {getAuth,signInAnonymously,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
import {normalizeProfile,defaultProfile} from './data.js';
const config={apiKey:'AIzaSyAqro1I6dDtRD8BeG_w0jtgrxhOECa-mq8',authDomain:'aloria-a0b09.firebaseapp.com',projectId:'aloria-a0b09',storageBucket:'aloria-a0b09.firebasestorage.app',messagingSenderId:'682640401106',appId:'1:682640401106:web:f200f784638541f81d430b'};
const app=initializeApp(config);const auth=getAuth(app);const db=getFirestore(app);let currentUid=null;let writeQueue=Promise.resolve();
export async function loadPlayer(){let user=auth.currentUser;if(!user){user=(await signInAnonymously(auth)).user}currentUid=user.uid;const snap=await getDoc(doc(db,'players',currentUid));if(snap.exists())return normalizeProfile(snap.data());const p=defaultProfile();await setDoc(doc(db,'players',currentUid),p);return p}
export function savePlayer(profile){if(!currentUid)return Promise.reject(new Error('Utilisateur non connecté'));const snapshot=JSON.parse(JSON.stringify(profile));writeQueue=writeQueue.catch(()=>{}).then(()=>setDoc(doc(db,'players',currentUid),snapshot));return writeQueue}
export function currentUserId(){return currentUid}
