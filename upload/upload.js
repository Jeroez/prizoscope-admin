import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBZjABn7nj9ICjtx8iTf-VMX1PitOQjeiI",
    authDomain: "prizoscope.firebaseapp.com",
    projectId: "prizoscope",
    storageBucket: "prizoscope.firebasestorage.app",
    messagingSenderId: "495746607948",
    appId: "1:495746607948:web:42b97c39ffed87f88ebde9",
    measurementId: "G-L6DGB8KCB9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to fetch JSON data and upload to Firebase
async function fetchJSONAndUpload() {
    try {
        console.log("Fetching JSON file...");
        const response = await fetch('./items.json');
        const items = await response.json();
        console.log("Fetched items:", items); // Debug log

        for (const item of items) {
            const documentId = item.name; // Use the name as the document ID
            console.log(`Uploading item with name as ID: ${documentId}...`); // Debug log
            const docRef = doc(db, "items", documentId);
            await setDoc(docRef, item);
            console.log(`Uploaded: ${item.name}`);
        }

        alert("All items uploaded successfully!");
    } catch (error) {
        console.error("Error fetching or uploading data:", error);
        alert("Failed to upload items. Check console for details.");
    }
}

// Trigger the upload process
fetchJSONAndUpload();
