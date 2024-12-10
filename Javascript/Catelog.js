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

    const now = Date.now(); // Define 'now' for promotion expiration checks

    // Reset the item grid
    itemGrid.innerHTML = `
        <div class="card add-card" onclick="showAddPopup()">
            <div class="add-icon">+</div>
        </div>
    `;

    try {
        const querySnapshot = await getDocs(itemsCollection);

        querySnapshot.forEach(async (docSnapshot) => {
            const data = docSnapshot.data();

            // Check if promotion exists and calculate remaining time
            const promotion = data.promotion;
            const remainingTime = promotion
                ? `<p class="promotion-time">${getTimeRemaining(promotion.expiration_time)}</p>`
                : "";

            if (promotion && promotion.expiration_time < now) {
                const itemDocRef = doc(db, "items", docSnapshot.id);
                await updateDoc(itemDocRef, { promotion: deleteField() });
                return;
            }

            // Create the item card
            const itemCard = document.createElement('div');
            itemCard.className = 'card item-card';

            const priceHTML = promotion
                ? `<p class="item-price"><s>₱${data.price}</s> <b>₱${promotion.discount_price}</b></p>`
                : `<p class="item-price">₱${data.price}</p>`;

            itemCard.innerHTML = `
                <img src="${data.img_url}" class="item-image" alt="${data.name}">
                <h3 class="item-name">${data.name}</h3>
                ${priceHTML}
                ${remainingTime}
                <button onclick="editItem('${docSnapshot.id}')">Edit</button>
                <button onclick="showDeletePopup('${docSnapshot.id}')">Delete</button>
                <button onclick="showPromotionPopup('${docSnapshot.id}')">Set Promotion</button>
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

    const expirationTime = Date.now() + duration * 60 * 60 * 1000; // Convert duration to milliseconds

    try {
        const itemDocRef = doc(db, "items", itemId);
        await updateDoc(itemDocRef, {
            promotion: {
                discount_price: parseFloat(discount),
                expiration_time: expirationTime,
            },
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
            await deleteDoc(doc(db, "items", itemToDeleteId));
            alert("Item deleted successfully!");
            closeDeletePopup();
            loadItems(); // Refresh the item list
        } catch (error) {
            console.error("Error deleting item: ", error);
            alert("Failed to delete the item. Please try again.");
        }
    }
}

async function editItem(itemId) {
    try {
        // Reference to the Firestore document for the item
        const itemDocRef = doc(db, "items", itemId);

        // Fetch the document snapshot
        const docSnap = await getDoc(itemDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            // Populate the popup fields with current item data
            document.getElementById('popup-title').textContent = "Edit Item";
            document.getElementById('item-image').value = data.img_url || "";
            document.getElementById('item-name').value = data.name || "";
            document.getElementById('item-price').value = data.price || "";

            // Attach the item ID to the popup to distinguish between adding and editing
            const popup = document.getElementById('add-popup');
            popup.setAttribute('data-edit-item-id', itemId);

            // Show the popup
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
    // Get popup elements
    const imageInput = document.getElementById('item-image');
    const nameInput = document.getElementById('item-name');
    const priceInput = document.getElementById('item-price');

    // Validate inputs
    const imgURL = imageInput.value.trim();
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);

    if (!imgURL || !name || isNaN(price)) {
        alert("All fields are required and price must be a number!");
        return;
    }

    try {
        // Check if editing or adding a new item
        const popup = document.getElementById('add-popup');
        const editItemId = popup.getAttribute('data-edit-item-id');

        if (editItemId) {
            // Update existing item
            const itemDocRef = doc(db, "items", editItemId);
            await updateDoc(itemDocRef, { img_url: imgURL, name: name, price: price });
            alert("Item updated successfully!");
            popup.removeAttribute('data-edit-item-id'); // Clear edit context
        } else {
            // Add new item
            await addDoc(itemsCollection, { img_url: imgURL, name: name, price: price });
            alert("Item added successfully!");
        }

        // Close popup and refresh items
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
