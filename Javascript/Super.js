import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDocs, 
    collection, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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

// Ensure only Super Admins can access this page
const sessionData = JSON.parse(sessionStorage.getItem('admin'));
if (!sessionData || !sessionData.isSuperAdmin) {
    alert("Unauthorized access!");
    window.location.href = "login.html";
}

// Load existing admins
const loadAdmins = async () => {
    const adminList = document.getElementById('admin-list');
    adminList.innerHTML = '';

    const snapshot = await getDocs(collection(db, "admins"));
    snapshot.forEach(doc => {
        const admin = doc.data();
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <div>
                <h3>${admin.username}</h3>
                <p>Store: ${admin.Store}</p>
            </div>
            <button class="delete-btn" onclick="deleteAdmin('${doc.id}')">Delete</button>
        `;
        adminList.appendChild(card);
    });
};

// Create new admin
document.getElementById('add-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('new-admin-username').value.trim();
    const password = document.getElementById('new-admin-password').value;
    const Store = document.getElementById('new-admin-store').value.trim();

    if (!username || !password || !Store) {
        alert("Please fill out all fields.");
        return;
    }

    try {
        // Save admin data in Firestore
        await setDoc(doc(db, "admins", username), {
            username,
            password,
            Store,
            createdAt: new Date().toISOString(),
        });

        alert("Admin created successfully!");
        document.getElementById('add-admin-form').reset();
        loadAdmins();
    } catch (error) {
        alert("Error creating admin: " + error.message);
    }
});

// Delete admin
window.deleteAdmin = async (adminId) => {
    if (confirm("Delete this admin permanently?")) {
        await deleteDoc(doc(db, "admins", adminId));
        alert("Admin deleted successfully.");
        loadAdmins();
    }
};

// Logout
window.logout = () => {
    sessionStorage.removeItem('admin');
    window.location.href = "login.html";
};

// Initial load
loadAdmins();
