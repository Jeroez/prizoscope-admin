import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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

/**
 * Utility function to calculate duration from expiration_time.
 */
function getDuration(expirationTime) {
    const now = Date.now();
    const remainingTime = expirationTime - now;

    if (remainingTime <= 0) {
        return "Expired";
    }

    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
}

/**
 * Load promotions from Firestore and separate them into current and past.
 */
async function loadPromotions() {
    const currentPromotionsList = document.getElementById('current-promotions-list');
    const pastPromotionsList = document.getElementById('past-promotions-list');
    if (!currentPromotionsList || !pastPromotionsList) {
        console.warn("Required elements for promotions not found.");
        return;
    }

    try {
        const itemsCollection = collection(db, "items");
        const querySnapshot = await getDocs(itemsCollection);

        console.log("Fetched promotions: ", querySnapshot.docs.length); // Debugging

        currentPromotionsList.innerHTML = ''; // Clear current promotions
        pastPromotionsList.innerHTML = ''; // Clear past promotions

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const itemName = docSnapshot.id; // Document ID as item name
            const discountPrice = data.promotion?.discount_price ?? "N/A";
            const expirationTime = data.promotion?.expiration_time ?? Date.now();
            const duration = getDuration(expirationTime);

            const promotionCard = document.createElement('div');
            promotionCard.className = 'promotion-card';
            promotionCard.innerHTML = `
                <div class="promotion-details">
                    <h3>${itemName}</h3>
                    <p><strong>Current Price:</strong> $${discountPrice}</p>
                    <p><strong>Duration:</strong> ${duration}</p>
                </div>
                <div class="promotion-actions">
                    <button class="${duration === "Expired" ? "delete-btn" : "end-btn"}" data-id="${docSnapshot.id}">
                        ${duration === "Expired" ? "Delete" : "End Promotion"}
                    </button>
                    ${duration === "Expired" ? "" : `<button class="edit-btn" data-id="${docSnapshot.id}">Edit Promotion</button>`}
                </div>
            `;

            if (duration === "Expired") {
                pastPromotionsList.appendChild(promotionCard);
            } else {
                currentPromotionsList.appendChild(promotionCard);
            }
        });

        // Attach event listeners for buttons in both sections
        document.querySelectorAll('.end-btn').forEach(button => {
            button.addEventListener('click', endPromotion);
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', deletePromotion);
        });
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', openEditModal);
        });

    } catch (error) {
        console.error("Error loading promotions:", error);
        currentPromotionsList.innerHTML = '<p>Failed to load promotions. Please try again later.</p>';
        pastPromotionsList.innerHTML = '<p>Failed to load promotions. Please try again later.</p>';
    }
}

/**
 * End a promotion by marking it as expired or moving it to past promotions.
 */
async function endPromotion(event) {
    const promotionId = event.target.dataset.id;

    try {
        const promotionDocRef = doc(db, "items", promotionId);
        await updateDoc(promotionDocRef, { "promotion.expiration_time": Date.now() }); // Mark as expired
        alert("Promotion ended successfully!");
        loadPromotions(); // Refresh promotions
    } catch (error) {
        console.error("Error ending promotion:", error);
        alert("Failed to end promotion. Please try again.");
    }
}

/**
 * Delete a promotion from Firestore.
 */
async function deletePromotion(event) {
    const promotionId = event.target.dataset.id;

    if (!confirm("Are you sure you want to delete this promotion? This action cannot be undone.")) {
        return;
    }

    try {
        const promotionDocRef = doc(db, "items", promotionId);
        await updateDoc(promotionDocRef, { promotion: deleteField() }); // Remove the promotion field
        alert("Promotion deleted successfully!");
        loadPromotions(); // Refresh promotions
    } catch (error) {
        console.error("Error deleting promotion:", error);
        alert("Failed to delete promotion. Please try again.");
    }
}

/**
 * Open the edit modal and populate data.
 */
function openEditModal(event) {
    const promotionId = event.target.dataset.id;
    const modal = document.getElementById('promotion-modal');
    const overlay = document.querySelector('.popup-overlay');
    modal.dataset.promotionId = promotionId; // Store promotion ID
    modal.classList.add('show');
    overlay.classList.add('show');
}

/**
 * Close the edit modal.
 */
function closeEditModal() {
    const modal = document.getElementById('promotion-modal');
    const overlay = document.querySelector('.popup-overlay');
    modal.classList.remove('show');
    overlay.classList.remove('show');
}

/**
 * Save changes to the promotion in Firestore.
 */
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
        const promotionDocRef = doc(db, "items", promotionId);
        const updateData = {};

        if (discount) updateData["promotion.discount_price"] = parseFloat(discount);
        if (duration) {
            const additionalTime = duration * 60 * 60 * 1000; // Convert hours to milliseconds
            const docSnap = await getDoc(promotionDocRef);
            updateData["promotion.expiration_time"] = docSnap.data().promotion.expiration_time + additionalTime;
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

// Load promotions on page load
window.addEventListener('DOMContentLoaded', loadPromotions);

// Attach the save button functionality
document.getElementById('save-edit-promotion-btn').addEventListener('click', saveEditPromotion);
