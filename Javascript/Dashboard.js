import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import {
    getFirestore, collection, getDocs, doc, updateDoc, deleteField, getDoc, query, where
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

// Admin session
const admin = JSON.parse(sessionStorage.getItem("admin")) || {};
const isSuperAdmin = admin?.isSuperAdmin || false;
const adminStore = admin?.Store || null;

console.log("Admin Session:", admin);
console.log("isSuperAdmin:", isSuperAdmin);
console.log("adminStore:", adminStore);

if (!isSuperAdmin && !adminStore) {
    alert("Error: No store assigned to this admin.");
    window.location.href = "index.html";
}

document.addEventListener('DOMContentLoaded', loadPromotions);

// Load promotions
async function loadPromotions() {
    const activePromotions = document.getElementById('active-promotions');
    const pastPromotions = document.getElementById('past-promotions');

    if (!activePromotions || !pastPromotions) {
        console.error("Error: Promotion containers not found in HTML.");
        return;
    }

    activePromotions.innerHTML = '';
    pastPromotions.innerHTML = '';

    try {
        let itemsRef = collection(db, "items");
        let itemsQuery = isSuperAdmin
            ? itemsRef
            : query(itemsRef, where("Store", "==", adminStore));

        console.log("Running query to fetch items...");

        const querySnapshot = await getDocs(itemsQuery);
        console.log(`Fetched ${querySnapshot.size} item(s) from Firestore.`);

        const now = Date.now();

        querySnapshot.forEach(docSnap => {
            const itemId = docSnap.id;
            const data = docSnap.data();

            console.log(`\n🧾 Item: ${itemId}`, data);

            if (!data.promotionPrice || !data.promotionExpiration) {
                console.warn(`⚠️ Skipping ${itemId} — Missing fields:`, {
                    promotionPrice: data.promotionPrice,
                    promotionExpiration: data.promotionExpiration
                });
                return;
            }

            const isExpired = Number(data.promotionExpiration) < now;
            const card = createPromotionCard(itemId, data, isExpired);

            if (isExpired) {
                console.log(`⏰ ${itemId} is expired.`);
                pastPromotions.appendChild(card);
            } else {
                console.log(`✅ ${itemId} is active.`);
                activePromotions.appendChild(card);
            }
        });

    } catch (err) {
        console.error("❌ Error loading promotions:", err);
    }
}

// Create a promotion card
function createPromotionCard(itemName, itemData, isExpired) {
    const card = document.createElement('div');
    card.className = 'promotion-card';

    const expirationText = getTimeRemaining(itemData.promotionExpiration);
    const original = itemData.originalPrice ?? "Not Available";
    const current = itemData.price;

    card.innerHTML = `
        <div class="promotion-details">
            <h3>${itemName}</h3>
            <p>Original Price: ₱${original}</p>
            <p>Discount Price: ₱${current}</p>
            <p>${expirationText}</p>
        </div>
        ${isSuperAdmin && !isExpired
            ? `<button onclick="endPromotion('${itemName}')">End Promotion</button>`
            : ''
        }
    `;
    return card;
}

// Get time remaining
function getTimeRemaining(expiration) {
    const now = Date.now();
    const diff = Number(expiration) - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Ends in: ${hours}h ${minutes}m`;
}

// End a promotion (Super Admin only)
async function endPromotion(itemName) {
    if (!isSuperAdmin) return;

    try {
        const itemRef = doc(db, "items", itemName);
        const itemSnap = await getDoc(itemRef);

        if (!itemSnap.exists()) {
            console.warn(`❌ Item ${itemName} not found in Firestore.`);
            return;
        }

        const data = itemSnap.data();
        const updates = {
            promotionExpiration: deleteField(),
            originalPrice: deleteField()
        };

        if (data.originalPrice) {
            updates.price = data.originalPrice;
        }

        await updateDoc(itemRef, updates);
        console.log(`✅ Promotion ended for item: ${itemName}`);
        loadPromotions();

    } catch (err) {
        console.error(`❌ Failed to end promotion for ${itemName}:`, err);
    }
}

window.logout = () => {
    sessionStorage.removeItem('admin');
    window.location.href = "index.html";
};

window.loadPromotions = loadPromotions;
window.endPromotion = endPromotion;
