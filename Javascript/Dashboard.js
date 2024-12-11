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
const itemsCollection = collection(db, "items"); // Adjust collection name if necessary

/**
 * Utility function to calculate the remaining time for promotions.
 */
function getTimeRemaining(expirationTime) {
    const now = Date.now();
    const diff = expirationTime - now;

    if (diff <= 0) {
        return "Expired";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${minutes}m remaining`;
}

/**
 * Load promotions from the Firestore database and display them.
 */
async function loadPromotions() {
    const promotionsList = document.getElementById("promotions-list");

    if (!promotionsList) {
        console.warn("Element with ID 'promotions-list' not found.");
        return;
    }

    try {
        const querySnapshot = await getDocs(itemsCollection);
        promotionsList.innerHTML = ""; // Clear the list

        querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();

            if (data.promotion) {
                const promotionItem = document.createElement("div");
                promotionItem.className = "promotion-item";
                promotionItem.innerHTML = `
                    <p><b>${data.name}</b></p>
                    <p>Discount Price: <b>₱${data.promotion.discount_price}</b></p>
                    <p>Original Price: <s>₱${data.price}</s></p>
                    <p><small>Expires in: ${getTimeRemaining(data.promotion.expiration_time)}</small></p>
                `;
                promotionsList.appendChild(promotionItem);
            }
        });
    } catch (error) {
        console.error("Error loading promotions:", error);
        promotionsList.innerHTML = "<p>Failed to load promotions. Please try again later.</p>";
    }
}

/**
 * Load orders (dummy implementation for now).
 */
async function loadOrders() {
    const ordersList = document.getElementById("orders-list");

    if (!ordersList) {
        console.warn("Element with ID 'orders-list' not found.");
        return;
    }

    // Replace this with real Firestore data-fetching logic when ready
    try {
        // Simulate fetching orders
        ordersList.innerHTML = `
            <div class="order-item">
                <p><b>Order #12345</b></p>
                <p>Customer: John Doe</p>
                <p>Total: ₱1200</p>
            </div>
            <div class="order-item">
                <p><b>Order #12346</b></p>
                <p>Customer: Jane Smith</p>
                <p>Total: ₱950</p>
            </div>
        `;
    } catch (error) {
        console.error("Error loading orders:", error);
        ordersList.innerHTML = "<p>Failed to load orders. Please try again later.</p>";
    }
}

// Initialize the dashboard
document.addEventListener("DOMContentLoaded", () => {
    loadPromotions();
    loadOrders();
});
