import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { get } from "svelte/store";
import { user, writingDisabled } from "./stores";

const firebaseConfig = {
    apiKey: "AIzaSyDfo9VTuTgc_72ysFrLMtFZilE7ZIzMz3o",
    authDomain: "kiermasz-zstio-v2.firebaseapp.com",
    projectId: "kiermasz-zstio-v2",
    storageBucket: "kiermasz-zstio-v2.appspot.com",
    messagingSenderId: "107191257707",
    appId: "1:107191257707:web:750fd8f561547921c07f2e",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, "europe-central2");

export const _sendEmail = httpsCallable(functions, "sendEmail");
export function sendEmail(data: { to: string; subject: string; html: string }) {
    if (get(writingDisabled)) return;
    return _sendEmail(data);
}

onAuthStateChanged(auth, (u) => user.set(u));
