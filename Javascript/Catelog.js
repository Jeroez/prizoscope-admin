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
    window.location.href = "index.html"; // Redirect to login if session data is invalid
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.itemsLoaded) { //  Ensure it runs only once
        window.itemsLoaded = true;
        await loadItems();
        if (isSuperAdmin) {
            await loadStoresForDropdown();
        }
    }
});

// Load items from database based on admin role
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
        let itemsQuery = isSuperAdmin
            ? query(itemsRef)
            : query(itemsRef, where("Store", "==", adminStore));

        const querySnapshot = await getDocs(itemsQuery);
        const processedItems = new Set();

        querySnapshot.forEach(docSnapshot => {
            const itemId = docSnapshot.id;
            const data = docSnapshot.data();
            const itemName = data.name || itemId;

            if (processedItems.has(itemId)) return;
            processedItems.add(itemId);

            const storeName = data.Store || "Unknown Store";
            const now = Date.now();
            const isPromotionActive = data.promotionExpiration && data.promotionExpiration > now;

            const priceHTML = isPromotionActive
                ? `<p class="item-price"><s>₱${data.originalPrice}</s> <b>₱${data.price}</b></p>`
                : `<p class="item-price">₱${data.price}</p>`;

            const itemCard = document.createElement('div');
            itemCard.className = 'card item-card';

            itemCard.innerHTML = `
                <div class="item-content">
                    <img src="${data.img_url}" class="item-image" alt="${itemName}">
                    <h3 class="item-name">${itemName}</h3>
                    ${priceHTML}
                    ${isSuperAdmin ? `<p class="store-label">Store: ${storeName}</p>` : ""}
                </div>
                <button onclick="editItem('${itemId}')">Edit</button>
                <button onclick="showDeletePopup(event, '${itemId}')">Delete</button>
                <button onclick="showPromotionPopup('${itemId}')">Set Promotion</button>
            `;

            itemCard.querySelector('.item-content').addEventListener("click", () => showReviewsPopup(itemName));
            itemGrid.appendChild(itemCard);
        });

    } catch (error) {
        console.error("Error loading items:", error);
    }
}

// Function to fetch and display reviews for the selected item
async function showItemReviews(itemName) {
    const reviewsPopup = document.getElementById("reviews-popup");
    const reviewsTitle = document.getElementById("reviews-title");
    const reviewsContainer = document.getElementById("reviews-container");

    if (!reviewsPopup || !reviewsContainer || !reviewsTitle) {
        console.error("Error: reviews popup elements not found!");
        return;
    }

    // Set the title
    reviewsTitle.innerText = `Reviews for ${itemName}`;
    reviewsContainer.innerHTML = `<p>Loading reviews...</p>`; // Reset reviews

    try {
        const reviewsRef = collection(db, "reviews");
        const querySnapshot = await getDocs(reviewsRef);

        let reviewsHTML = "";

        querySnapshot.forEach((doc) => {
            const reviewData = doc.data();
            if (reviewData.itemName === itemName) {
                reviewsHTML += `
                    <div class="review-card">
                        <p><strong>${reviewData.user}:</strong> ${reviewData.comment}</p>
                        <p>Rating: ⭐${reviewData.rating}</p>
                    </div>
                `;
            }
        });

        reviewsContainer.innerHTML = reviewsHTML || `<p>No reviews for this item yet.</p>`;

    } catch (error) {
        console.error("Error fetching reviews:", error);
        reviewsContainer.innerHTML = `<p>Error loading reviews.</p>`;
    }

    // Show the popup
    reviewsPopup.style.display = "block";
}
// Show the reviews popup
async function showReviewsPopup(itemName) {
    const reviewsPopup = document.getElementById("reviews-popup");
    const reviewsTitle = document.getElementById("reviews-title");
    const reviewsContainer = document.getElementById("reviews-container");

    if (!reviewsPopup || !reviewsContainer || !reviewsTitle) {
        console.error("Error: reviews popup elements not found!");
        return;
    }

    // Set the title
    reviewsTitle.innerText = `Reviews for ${itemName}`;
    reviewsContainer.innerHTML = `<p>Loading reviews...</p>`; // Reset content

    try {
        const reviewsRef = collection(db, "reviews");
        const reviewsQuery = query(reviewsRef, where("itemName", "==", itemName));
        const querySnapshot = await getDocs(reviewsQuery);

        let reviewsHTML = "";
        querySnapshot.forEach((doc) => {
            const reviewData = doc.data();
            reviewsHTML += `
                <div class="review-card">
                    <p><strong>${reviewData.user}:</strong> ${reviewData.comment}</p>
                    <p>Rating: ⭐${reviewData.rating}</p>
                </div>
            `;
        });

        reviewsContainer.innerHTML = reviewsHTML || `<p>No reviews for this item yet.</p>`;
    } catch (error) {
        console.error("Error fetching reviews:", error);
        reviewsContainer.innerHTML = `<p>Error loading reviews.</p>`;
    }

    // Show the popup
    reviewsPopup.style.display = "block";
}

// Close the reviews popup
function closeReviewsPopup() {
    const reviewsPopup = document.getElementById("reviews-popup");
    if (reviewsPopup) {
        reviewsPopup.style.display = "none";
    } else {
        console.error("closeReviewsPopup: reviews-popup element not found!");
    }
}

let selectedItemId = null;

function openPromotionPopup(itemId) {
  selectedItemId = itemId;
  document.getElementById("promotion-popup").style.display = "block";
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


async function editItem(itemId) {
    try {
        const itemDocRef = doc(db, "items", String(itemId)); // Use actual document ID
        const docSnap = await getDoc(itemDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            document.getElementById('popup-title').textContent = "Edit Item";
            document.getElementById('item-image').value = data.img_url || "";
            document.getElementById('item-name').value = data.name || "";
            document.getElementById('item-price').value = data.price || "";

            const popup = document.getElementById('add-popup');
            popup.setAttribute('data-edit-item-id', String(itemId));
            popup.style.display = "flex";
        } else {
            alert("Item not found!");
        }
    } catch (error) {
        console.error("Error fetching item for editing:", error);
        alert("Failed to load item.");
    }
}

// Save promotion and schedule expiration
async function savePromotion() {
    try {
        const popup = document.getElementById('promotion-popup');
        const itemId = String(popup.getAttribute('data-item-id'));
        const discountPrice = document.getElementById('discount').value.trim();
        const durationHours = document.getElementById('duration').value.trim();

        if (!itemId || !discountPrice || !durationHours) {
            alert("All fields are required!");
            return;
        }

        const numericDiscount = parseFloat(discountPrice);
        const numericDuration = parseInt(durationHours);
        if (isNaN(numericDiscount) || isNaN(numericDuration)) {
            alert("Invalid number format!");
            return;
        }

        const durationMs = numericDuration * 60 * 60 * 1000;
        const promotionExpiration = Date.now() + durationMs;

        const itemRef = doc(db, "items", itemId);
        const docSnap = await getDoc(itemRef);
        if (!docSnap.exists()) {
            alert("Item does not exist!");
            return;
        }

        const itemData = docSnap.data();
        const originalPrice = itemData.price;

        // Update item with promo data
        await updateDoc(itemRef, {
            originalPrice: originalPrice,
            price: numericDiscount,
            promotionPrice: numericDiscount,
            promotionExpiration: promotionExpiration
        });

        alert("Promotion saved successfully!");
        closePromotionPopup();
        await loadItems();

        // Revert price after promotion ends
        setTimeout(async () => {
            try {
                const latestSnap = await getDoc(itemRef);
                const latestData = latestSnap.data();

                if (latestData.promotionExpiration === promotionExpiration) {
                    await updateDoc(itemRef, {
                        price: latestData.originalPrice || numericDiscount,
                        originalPrice: deleteField()
                    });
                    console.log(`Promotion expired for item: ${itemId}`);
                    await loadItems();
                }
            } catch (error) {
                console.error("Error reverting price after promotion:", error);
            }
        }, durationMs);

    } catch (error) {
        console.error("Error saving promotion:", error);
        alert(`Failed to save promotion: ${error.message}`);
    }
}



function closePromotionPopup() {
    const popup = document.getElementById('promotion-popup');
    popup.style.display = "none";
}

async function confirmDeleteItem() {
    if (!itemToDeleteId) {
        console.error("Error: No item selected for deletion.");
        return;
    }

    try {
        await deleteDoc(doc(db, "items", itemToDeleteId)); //  Delete from Firestore
        alert("Item deleted successfully!");

        closeDeletePopup(); //  Close popup first
        await loadItems();  //  Reload items to reflect deletion

        itemToDeleteId = null; //  Clear the stored ID

    } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item. Please try again.");
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
    const price = parseFloat(document.getElementById('item-price').value.trim());
    const popup = document.getElementById('add-popup');
    const editingId = popup.getAttribute('data-edit-item-id');

    let Store = isSuperAdmin
        ? document.getElementById('store-dropdown').value
        : adminStore;

    if (!imgURL || !name || !price || !Store) {
        alert("All fields are required!");
        return;
    }

    try {
        const docId = name; // Use product name as document ID
        const itemRef = doc(db, "items", docId);

        const baseItemData = {
            name,
            img_url: imgURL,
            price,
            Store,
            rating: "5"
        };

        if (editingId) {
            await updateDoc(itemRef, baseItemData);
            alert("Item updated successfully!");
        } else {
            await setDoc(itemRef, baseItemData);
            alert("Item added successfully!");
        }

        closePopup();
        await loadItems();

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

function showDeletePopup(event, itemId) {
    event.stopPropagation(); // ✅ Prevents accidental event bubbling

    itemToDeleteId = itemId;
    const deletePopup = document.getElementById('delete-popup');

    if (!deletePopup) {
        console.error("Error: Delete popup element not found.");
        return;
    }

    deletePopup.style.display = "flex";
}



function closeDeletePopup() {
    const deletePopup = document.getElementById('delete-popup');
    
    if (!deletePopup) {
        console.error("Error: Delete popup element not found.");
        return;
    }

    deletePopup.style.display = "none";
    itemToDeleteId = null; // ✅ Clear the stored ID when closing
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
window.logout = () => {
    sessionStorage.removeItem('admin');
    window.location.href = "index.html";
};

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
window.closeReviewsPopup = closeReviewsPopup;
window.showReviewsPopup = showReviewsPopup;