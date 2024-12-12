import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";

// Firebase Configuration
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
const itemsCollection = collection(db, "items"); // Adjust collection if needed

/**
 * Utility function to calculate the remaining time for promotions.
 */
function getTimeRemaining(expirationTime) {
    const now = Date.now();
    const diff = expirationTime - now;

    if (diff <= 0) {
        return "Expired";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
}

/**
 * Load promotions from the database and display them in the promotions list.
 */
async function loadPromotions() {
    const promotionsList = document.getElementById('promotions-list');
    if (!promotionsList) {
        console.warn("Element with ID 'promotions-list' not found.");
        return;
    }

    try {
        const promotionsCollection = collection(db, "promotions");
        const querySnapshot = await getDocs(promotionsCollection);
        promotionsList.innerHTML = ''; // Clear the list

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();

            const promotionItem = document.createElement('div');
            promotionItem.className = 'promotion-item';
            promotionItem.innerHTML = `
                <p><b>${data.item_id}</b></p>
                <p>Discount Price: <b>₱${data.discount_price}</b></p>
                <p><small>Expires in: ${getTimeRemaining(data.expiration_time)}</small></p>
                <button class="edit-promotion-btn" data-id="${docSnapshot.id}">Edit</button>
                <button class="remove-promotion-btn" data-id="${docSnapshot.id}">Remove</button>
            `;
            promotionsList.appendChild(promotionItem);
        });

        // Attach event listeners
        document.querySelectorAll('.edit-promotion-btn').forEach(button => {
            button.addEventListener('click', openEditModal);
        });
        document.querySelectorAll('.remove-promotion-btn').forEach(button => {
            button.addEventListener('click', removePromotion);
        });
    } catch (error) {
        console.error("Error loading promotions:", error);
        promotionsList.innerHTML = '<p>Failed to load promotions. Please try again later.</p>';
    }
}


async function removePromotion(event) {
    const promotionId = event.target.dataset.id;

    try {
        const promotionDocRef = doc(db, "promotions", promotionId);
        await deleteDoc(promotionDocRef); // Remove from promotions collection
        alert("Promotion removed successfully!");
        loadPromotions(); // Reload promotions
    } catch (error) {
        console.error("Error removing promotion:", error);
        alert("Failed to remove promotion. Please try again.");
    }
}

function openEditModal(event) {
    const promotionId = event.target.dataset.id;
    const modal = document.getElementById('promotion-modal');
    modal.dataset.promotionId = promotionId; // Save promotion ID for later
    modal.style.display = "block";
}

async function saveEditPromotion() {
    const modal = document.getElementById('promotion-modal');
    const promotionId = modal.dataset.promotionId;
    const discount = document.getElementById('edit-discount-price').value;
    const duration = document.getElementById('edit-duration').value;

    if (!discount && !duration) {
        alert("Please provide at least one field to update!");
        return;
    }

    try {
        const promotionDocRef = doc(db, "promotions", promotionId);
        const updateData = {};

        if (discount) updateData.discount_price = parseFloat(discount);
        if (duration) {
            const additionalTime = duration * 60 * 60 * 1000; // Convert to milliseconds
            const docSnap = await getDoc(promotionDocRef);
            updateData.expiration_time = docSnap.data().expiration_time + additionalTime;
        }

        await updateDoc(promotionDocRef, updateData);
        alert("Promotion updated successfully!");
        closeEditModal();
        loadPromotions();
    } catch (error) {
        console.error("Error updating promotion:", error);
        alert("Failed to update promotion. Please try again.");
    }
}

function closeEditModal() {
    const modal = document.getElementById('promotion-modal');
    modal.style.display = "none";
}


