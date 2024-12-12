import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, deleteField  } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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
const itemsCollection = collection(db, "items");


document.addEventListener('DOMContentLoaded', () => {
    const itemGrid = document.getElementById('item-grid');
    if (!itemGrid) {
        console.error("Element with ID 'item-grid' not found.");
        return;
    }

    loadItems();
});

// Load items from the database and render them
async function loadItems() {
    const itemGrid = document.getElementById('item-grid');
    if (!itemGrid) {
        console.error("Element with ID 'item-grid' not found.");
        return;
    }

    const now = Date.now(); // For promotion expiration checks

    // Reset the item grid
    itemGrid.innerHTML = `
        <div class="card add-card" onclick="showAddPopup()">
            <div class="add-icon">+</div>
        </div>
    `;

    try {
        const querySnapshot = await getDocs(itemsCollection);

        querySnapshot.forEach(async (docSnapshot) => {
            const itemName = docSnapshot.id; // Use the document name as the item's name
            const data = docSnapshot.data();

            // Check for expired promotions
            if (data.promotion && parseInt(data.promotion.expiration_time) < now) {
                const itemDocRef = doc(db, "items", itemName);
                await updateDoc(itemDocRef, { promotion: deleteField() });
                return;
            }

            // Render the item card
            const itemCard = document.createElement('div');
            itemCard.className = 'card item-card';

            const priceHTML = data.promotion
                ? `<p class="item-price"><s>₱${data.price}</s> <b>₱${data.promotion.discount_price}</b></p>`
                : `<p class="item-price">₱${data.price}</p>`;

            const remainingTime = data.promotion
                ? `<p class="promotion-time">${getTimeRemaining(parseInt(data.promotion.expiration_time))}</p>`
                : "";

            itemCard.innerHTML = `
                <img src="${data.img_url}" class="item-image" alt="${itemName}">
                <h3 class="item-name">${itemName}</h3>
                ${priceHTML}
                ${remainingTime}
                <button onclick="editItem('${itemName}')">Edit</button>
                <button onclick="showDeletePopup('${itemName}')">Delete</button>
                <button onclick="showPromotionPopup('${itemName}')">Set Promotion</button>
            `;

            itemGrid.appendChild(itemCard);
        });
    } catch (error) {
        console.error("Error loading items:", error);
        alert("Failed to load items. Please try again.");
    }
}

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

// Search functionality for items
function searchItems() {
    const searchQuery = document.getElementById('search-bar').value.toLowerCase();
    const itemCards = document.querySelectorAll('.item-card');

    itemCards.forEach(card => {
        const itemName = card.querySelector('.item-name').textContent.toLowerCase();
        card.style.display = itemName.includes(searchQuery) ? 'block' : 'none';
    });
}

// Delete an item by ID
async function deleteItem(id) {
    if (confirm("Are you sure you want to delete this item?")) {
        try {
            await deleteDoc(doc(db, "items", id));
            alert("Item deleted successfully!");
            loadItems(); // Refresh the item list
        } catch (error) {
            console.error("Error deleting item: ", error);
            alert("Failed to delete the item. Please try again.");
        }
    }
}

// Show the Add Item Popup
function showAddPopup() {
    const popup = document.getElementById('add-popup');
    document.getElementById('popup-title').textContent = "Add New Item";
    document.getElementById('item-image').value = "";
    document.getElementById('item-name').value = "";
    document.getElementById('item-price').value = "";
    popup.style.display = "flex";
}

// Close the Add Item Popup
function closePopup() {
    const popup = document.getElementById('add-popup');
    popup.style.display = "none";
}

// Show the Promotion Popup
function showPromotionPopup(itemId) {
    const popup = document.getElementById('promotion-popup');
    popup.setAttribute('data-item-id', itemId); // Attach item ID to popup for context
    popup.style.display = "flex";
}

// Close the Promotion Popup
function closePromotionPopup() {
    const popup = document.getElementById('promotion-popup');
    popup.style.display = "none";
    popup.removeAttribute('data-item-id'); // Clean up after closing
}

// Save Promotion Details
async function savePromotion() {
    const popup = document.getElementById('promotion-popup');
    const itemId = popup.getAttribute('data-item-id');
    const discount = document.getElementById('discount').value;
    const duration = document.getElementById('duration').value;

    if (!discount || !duration) {
        alert("Please fill out all fields for the promotion!");
        return;
    }

    const expirationTime = (Date.now() + parseInt(duration) * 60 * 60 * 1000).toString(); // Convert duration to milliseconds and store as string

    try {
        const itemDocRef = doc(db, "items", itemId);
        const promotionData = {
            discount_price: discount.toString(), // Store as string
            expiration_time: expirationTime, // Store as string
        };

        // Save to item
        await updateDoc(itemDocRef, { promotion: promotionData });

        // Save to promotions collection
        const promotionsCollection = collection(db, "promotions");
        await addDoc(promotionsCollection, {
            item_id: itemId,
            ...promotionData,
        });

        alert("Promotion set successfully!");
        closePromotionPopup();
        loadItems();
    } catch (error) {
        console.error("Error setting promotion:", error);
        alert("Failed to set promotion. Please try again.");
    }
}

let itemToDeleteId = null; // Track the item to delete

function showDeletePopup(itemId) {
    itemToDeleteId = itemId; // Store the item ID for deletion
    const deletePopup = document.getElementById('delete-popup');
    deletePopup.style.display = "flex";
}

function closeDeletePopup() {
    const deletePopup = document.getElementById('delete-popup');
    deletePopup.style.display = "none";
    itemToDeleteId = null; // Reset the tracked item ID
}

async function confirmDeleteItem() {
    if (itemToDeleteId) {
        try {
            const itemDocRef = doc(db, "items", itemToDeleteId); // Use item name as the document ID
            await deleteDoc(itemDocRef);
            alert("Item deleted successfully!");
            closeDeletePopup();
            loadItems(); // Refresh the item list
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Failed to delete the item. Please try again.");
        }
    }
}


async function editItem(itemName) {
    try {
        const itemDocRef = doc(db, "items", itemName); // Reference by item name
        const docSnap = await getDoc(itemDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            document.getElementById('popup-title').textContent = "Edit Item";
            document.getElementById('item-image').value = data.img_url || "";
            document.getElementById('item-name').value = data.name || "";
            document.getElementById('item-price').value = data.price || "";

            const popup = document.getElementById('add-popup');
            popup.setAttribute('data-edit-item-id', itemName); // Attach item name for editing
            popup.style.display = "flex";
        } else {
            alert("Item not found!");
        }
    } catch (error) {
        console.error("Error fetching item for editing:", error);
        alert("Failed to load item. Please try again.");
    }
}



async function saveItem() {
    const imageInput = document.getElementById('item-image');
    const nameInput = document.getElementById('item-name');
    const priceInput = document.getElementById('item-price');

    const imgURL = imageInput.value.trim();
    const name = nameInput.value.trim();
    const price = priceInput.value.trim(); // Keep as string

    if (!imgURL || !name || !price) {
        alert("All fields are required!");
        return;
    }

    try {
        const popup = document.getElementById('add-popup');
        const editItemName = popup.getAttribute('data-edit-item-id');

        if (editItemName) {
            // Update existing item
            const itemDocRef = doc(db, "items", editItemName);
            await updateDoc(itemDocRef, { img_url: imgURL, price, name });
            alert("Item updated successfully!");
            popup.removeAttribute('data-edit-item-id'); // Clear edit context
        } else {
            // Add a new item
            const itemDocRef = doc(db, "items", name); // Use item name as the document ID
            await setDoc(itemDocRef, { img_url: imgURL, price, name });
            alert("Item added successfully!");
        }

        closePopup();
        loadItems();
    } catch (error) {
        console.error("Error saving item:", error);
        alert("Failed to save item. Please try again.");
    }
}










// Attach to globallly
window.showAddPopup = showAddPopup;
window.closePopup = closePopup;
window.showPromotionPopup = showPromotionPopup;
window.closePromotionPopup = closePromotionPopup;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.showDeletePopup = showDeletePopup;
window.closeDeletePopup = closeDeletePopup;
window.confirmDeleteItem = confirmDeleteItem;
window.searchItems = searchItems;
window.savePromotion = savePromotion;
window.saveItem = saveItem;

// Automatically load items on page load
window.onload = loadItems;
