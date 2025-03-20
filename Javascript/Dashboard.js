import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, doc, updateDoc, deleteField, query, where 
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBZjABn7nj9ICjtx8iTf-VMX1PitOQjeiI",
    authDomain: "prizoscope.firebaseapp.com",
    projectId: "prizoscope",
    storageBucket: "prizoscope.appspot.com",
    messagingSenderId: "495746607948",
    appId: "1:495746607948:web:42b97c39ffed87f88ebde9",
    measurementId: "G-L6DGB8KCB9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Retrieve admin session
const admin = JSON.parse(sessionStorage.getItem("admin")) || {};
const isSuperAdmin = admin?.isSuperAdmin || false;
const adminStore = admin?.Store?.[0] || null;

if (!isSuperAdmin && !adminStore) {
    alert("Error: No store assigned to this admin.");
    window.location.href = "login.html"; // Redirect to login if session data is invalid
}

document.addEventListener('DOMContentLoaded', loadPromotions);

// Load promotions based on admin access
async function loadPromotions() {
    const activePromotions = document.getElementById('active-promotions');
    const pastPromotions = document.getElementById('past-promotions');

    activePromotions.innerHTML = '';
    pastPromotions.innerHTML = '';

    try {
        let promotionsQuery = collection(db, "items");

        // Super Admin sees all promotions; Store Admin sees only their store's promotions
        if (!isSuperAdmin) {
            promotionsQuery = query(promotionsQuery, where("store", "==", adminStore));
        }

        const querySnapshot = await getDocs(promotionsQuery);
        const now = Date.now();

        querySnapshot.forEach(docSnapshot => {
            const data = docSnapshot.data();
            if (!data.promotion) return;

            const promotionCard = createPromotionCard(docSnapshot.id, data);
            const isExpired = parseInt(data.promotion.expiration_time) < now;

            isExpired ? pastPromotions.appendChild(promotionCard) : activePromotions.appendChild(promotionCard);
        });

    } catch (error) {
        console.error("Error loading promotions:", error);
    }
}

// Create a promotion card
function createPromotionCard(itemName, itemData) {
    const card = document.createElement('div');
    card.className = 'promotion-card';
    
    card.innerHTML = `
        <div class="promotion-details">
            <h3>${itemName}</h3>
            <p>Original Price: ₱${itemData.price}</p>
            <p>Discount Price: ₱${itemData.promotion.discount_price}</p>
            <p>${getTimeRemaining(parseInt(itemData.promotion.expiration_time))}</p>
        </div>
        ${isSuperAdmin ? `<button onclick="endPromotion('${itemName}')">End Promotion</button>` : ''}
    `;

    return card;
}

// Get time remaining
function getTimeRemaining(expirationTime) {
    const now = Date.now();
    const diff = expirationTime - now;
    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Ends in: ${hours}h ${minutes}m`;
}

// End a promotion (Super Admin only)
async function endPromotion(itemName) {
    if (!isSuperAdmin) return;
    try {
        await updateDoc(doc(db, "items", itemName), { promotion: deleteField() });
        loadPromotions();
    } catch (error) {
        console.error("Error ending promotion:", error);
    }
}
window.logout = () => {
    sessionStorage.removeItem('admin');
    window.location.href = "login.html";
};

window.loadPromotions = loadPromotions;
window.endPromotion = endPromotion;
