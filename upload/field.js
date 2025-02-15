import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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

// Function to update documents that do not have the "Store" field
async function updateItems() {
    try {
        const itemsCollection = collection(db, "items");
        const querySnapshot = await getDocs(itemsCollection);
        
        if (querySnapshot.empty) {
            console.log("No items found.");
            alert("No items found in Firestore.");
            return;
        }

        let updateCount = 0;
        const batchSize = 500; // Process only up to 500 documents

        for (const docSnapshot of querySnapshot.docs) {
            if (updateCount >= batchSize) break; // Stop after 500 updates
            
            const data = docSnapshot.data();
            if (!data.Store) {  // Only update if "Store" field is missing
                const docRef = doc(db, "items", docSnapshot.id);
                await updateDoc(docRef, { Store: "BTech" });
                console.log(`Updated ${docSnapshot.id} with Store="BTech"`);
                updateCount++;
            }
        }

        alert(`Updated ${updateCount} items successfully!`);
    } catch (error) {
        console.error("Error updating documents:", error);
        alert("Failed to update items. Check console for details.");
    }
}

// Run the update function when the page loads
updateItems();
