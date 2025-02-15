import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, getDoc, updateDoc, deleteDoc, doc, deleteField, setDoc, query, where } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Retrieve admin session
const admin = JSON.parse(sessionStorage.getItem("admin")) || {};
const isSuperAdmin = admin?.isSuperAdmin || false;
const adminStore = admin?.Store || null;

if (!isSuperAdmin && !adminStore) {
    alert("Error: No store assigned to this admin.");
    window.location.href = "login.html"; // Redirect to login if session data is invalid
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadItems();
    if (isSuperAdmin) {
        await loadStoresForDropdown();
    }
});

// Load items from database based on admin role
async function loadItems() {
    const itemGrid = document.getElementById('item-grid');
    itemGrid.innerHTML = `
        <div class="card add-card" onclick="showAddPopup()">
            <div class="add-icon">+</div>
        </div>
    `;

    try {
        let itemsRef = collection(db, "items");
        let itemsQuery = isSuperAdmin ? itemsRef : query(itemsRef, where("Store", "==", adminStore));

        const querySnapshot = await getDocs(itemsQuery);
        querySnapshot.forEach(docSnapshot => {
            const data = docSnapshot.data();
            const itemName = docSnapshot.id;

            console.log(`Item: ${itemName}`, data);

            const storeName = data.Store || data.Store || "Unknown Store";

            const now = Date.now();
            const isPromotionActive = data.promotionExpiration && data.promotionExpiration > now;

            const priceHTML = isPromotionActive
                ? `<p class="item-price"><s>₱${data.price}</s> <b>₱${data.promotionPrice}</b></p>`
                : `<p class="item-price">₱${data.price}</p>`;

            const itemCard = document.createElement('div');
            itemCard.className = 'card item-card';
            itemCard.innerHTML = `
                <img src="${data.img_url}" class="item-image" alt="${itemName}">
                <h3 class="item-name">${itemName}</h3>
                ${priceHTML}
                ${isSuperAdmin ? `<p class="store-label">Store: ${storeName}</p>` : ""}
                <button onclick="editItem('${itemName}')">Edit</button>
                <button onclick="showDeletePopup('${itemName}')">Delete</button>
                <button onclick="showPromotionPopup('${itemName}')">Set Promotion</button>
            `;
            itemGrid.appendChild(itemCard);
        });

    } catch (error) {
        console.error("Error loading items:", error);
    }
}


function showPromotionPopup(itemId) {
    const popup = document.getElementById('promotion-popup');

    if (!popup) {
        console.error("Promotion popup element not found.");
        return;
    }

    popup.setAttribute('data-item-id', itemId);
    popup.style.display = "flex";
}


async function editItem(itemName) {
    try {
        const itemDocRef = doc(db, "items", itemName);
        const docSnap = await getDoc(itemDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            document.getElementById('popup-title').textContent = "Edit Item";
            document.getElementById('item-image').value = data.img_url || "";
            document.getElementById('item-name').value = itemName;
            document.getElementById('item-price').value = data.price || "";

            const popup = document.getElementById('add-popup');
            popup.setAttribute('data-edit-item-id', itemName);
            popup.style.display = "flex";
        } else {
            alert("Item not found!");
        }
    } catch (error) {
        console.error("Error fetching item for editing:", error);
        alert("Failed to load item.");
    }
}
async function savePromotion() {
    const popup = document.getElementById('promotion-popup');
    const itemId = popup.getAttribute('data-item-id');
    const priceInput = document.getElementById('discount');
    const durationInput = document.getElementById('duration');

    if (!priceInput || !durationInput) {
        alert("Error: Promotion input fields not found!");
        return;
    }

    let promotionPrice = Number(priceInput.value.trim());
    let promotionDuration = Number(durationInput.value.trim()); // Duration in hours

    if (!itemId || isNaN(promotionPrice) || promotionPrice <= 0 || isNaN(promotionDuration) || promotionDuration <= 0) {
        alert("Invalid input. Please enter valid numbers.");
        return;
    }

    // ✅ Convert Hours to Milliseconds
    const expirationTime = Date.now() + promotionDuration * 60 * 60 * 1000;

    try {
        console.log("Saving promotion:", { itemId, promotionPrice, expirationTime });

        const itemRef = doc(db, "items", itemId);
        await updateDoc(itemRef, {
            "promotionPrice": promotionPrice,
            "promotionExpiration": expirationTime // Save as timestamp
        });

        alert("Promotion set successfully!");
        closePromotionPopup();
    } catch (error) {
        console.error("Error saving promotion:", error);
        alert("Failed to save promotion.");
    }
}




function closePromotionPopup() {
    const popup = document.getElementById('promotion-popup');
    popup.style.display = "none";
}

async function confirmDeleteItem() {
    if (!itemToDeleteId) {
        console.error("No item selected for deletion.");
        return;
    }

    if (confirm("Are you sure you want to delete this item?")) {
        try {
            await deleteDoc(doc(db, "items", itemToDeleteId));
            alert("Item deleted successfully!");
            loadItems();
            closeDeletePopup();
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    }
}

async function loadStoresForDropdown() {
    setTimeout(() => {
        const storeDropdown = document.getElementById('store-dropdown');

        if (!storeDropdown) {
            console.error("ERROR: Store dropdown element not found. Ensure the HTML contains <select id='store-dropdown'> and script is placed at the bottom.");
            return;
        }

        storeDropdown.innerHTML = '<option value="">Select Store</option>';

        getDocs(collection(db, "admins"))
            .then(querySnapshot => {
                querySnapshot.forEach(docSnapshot => {
                    const storeName = docSnapshot.id;
                    const option = document.createElement('option');
                    option.value = storeName;
                    option.textContent = storeName;
                    storeDropdown.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Error loading stores:", error);
            });
    }, 100);
}



// Show add/edit popup
function showAddPopup() {
    const popup = document.getElementById('add-popup');

    if (!popup) {
        console.error("Add popup element not found.");
        return;
    }

    document.getElementById('popup-title').textContent = "Add New Item";
    document.getElementById('item-image').value = "";
    document.getElementById('item-name').value = "";
    document.getElementById('item-price').value = "";

    if (isSuperAdmin) {
        const storeDropdown = document.getElementById('store-dropdown');
        if (storeDropdown) {
            storeDropdown.style.display = "block";
        }
    } else {
        const storeDropdown = document.getElementById('store-dropdown');
        if (storeDropdown) {
            storeDropdown.style.display = "none";
        }
    }

    popup.style.display = "flex";
}


// Save item (add or update)
async function saveItem() {
    const imgURL = document.getElementById('item-image').value.trim();
    const name = document.getElementById('item-name').value.trim();
    const price = document.getElementById('item-price').value.trim();
    const popup = document.getElementById('add-popup');
    const editingId = popup.getAttribute('data-editing');

    let store = isSuperAdmin
        ? document.getElementById('store-dropdown').value
        : adminStore;

    if (!imgURL || !name || !price || !store) {
        alert("All fields are required!");
        return;
    }

    try {
        const itemRef = doc(db, "items", name);

        if (editingId) {
            await updateDoc(itemRef, { img_url: imgURL, price, store });
            alert("Item updated successfully!");
        } else {
            await setDoc(itemRef, { img_url: imgURL, price, store });
            alert("Item added successfully!");
        }

        closePopup();
        loadItems();

    } catch (error) {
        console.error("Error saving item:", error);
        alert("Failed to save item.");
    }
}

// Delete item
async function deleteItem(itemId) {
    if (confirm("Are you sure you want to delete this item?")) {
        try {
            await deleteDoc(doc(db, "items", itemId));
            alert("Item deleted successfully!");
            loadItems();
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    }
}

// Show/close popups
let itemToDeleteId = null; 

function showDeletePopup(itemId) {
    itemToDeleteId = itemId;
    const deletePopup = document.getElementById('delete-popup');

    if (!deletePopup) {
        console.error("Delete popup element not found.");
        return;
    }

    deletePopup.style.display = "flex";
}


function closeDeletePopup() {
    document.getElementById('delete-popup').style.display = "none";
    itemToDeleteId = null;
}
function closePopup() {
    document.getElementById('add-popup').style.display = "none";
}

// Search items
function searchItems() {
    const searchQuery = document.getElementById('search-bar').value.toLowerCase();
    const itemCards = document.querySelectorAll('.item-card');

    itemCards.forEach(card => {
        const itemName = card.querySelector('.item-name').textContent.toLowerCase();
        card.style.display = itemName.includes(searchQuery) ? 'block' : 'none';
    });
}

// Attach functions globally
window.showDeletePopup = showDeletePopup;
window.showPromotionPopup = showPromotionPopup;
window.showAddPopup = showAddPopup;
window.closePopup = closePopup;
window.saveItem = saveItem;
window.deleteItem = deleteItem;
window.showDeletePopup = showDeletePopup;
window.closeDeletePopup = closeDeletePopup;
window.searchItems = searchItems;
window.loadItems = loadItems;
window.editItem = editItem;
window.savePromotion = savePromotion;
window.confirmDeleteItem = confirmDeleteItem;
window.closePromotionPopup = closePromotionPopup;

// Load items on page load
window.onload = loadItems;
