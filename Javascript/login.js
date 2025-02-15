import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Debugging: Check if script is loaded
console.log("login.js loaded successfully");

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBZjABn7nj9ICjtx8iTf-VMX1PitOQjeiI",
    authDomain: "prizoscope.firebaseapp.com",
    projectId: "prizoscope",
    storageBucket: "prizoscope.appspot.com",
    messagingSenderId: "495746607948",
    appId: "1:495746607948:web:42b97c39ffed87f88ebde9",
    measurementId: "G-L6DGB8KCB9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Firebase initialized:", app);

// Function to handle login
async function handleLogin(e) {
    e.preventDefault(); // Prevent default form submission
    console.log("Form submitted");

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    console.log("Username:", username);
    console.log("Password:", password.length > 0 ? "Entered" : "Not entered");

    try {
        // Fetch user data from Firestore
        const adminRef = doc(db, "admins", username);
        console.log("Fetching admin document:", adminRef.path);

        const adminDoc = await getDoc(adminRef);
        console.log("Firestore response:", adminDoc.exists() ? "Document found" : "No document");

        if (!adminDoc.exists()) {
            throw new Error("Invalid username or password");
        }

        const adminData = adminDoc.data();
        console.log("Stored Password:", adminData.password);

        // Compare passwords (NO HASHING)
        if (password !== adminData.password) {
            throw new Error("Invalid username or password");
        }

        // Store session data
        sessionStorage.setItem('admin', JSON.stringify({
            username,
            isSuperAdmin: adminData.isSuperAdmin || false,
            Store: adminData.Store || null
        }));

        console.log("Login successful! Redirecting...");

        window.location.href = adminData.isSuperAdmin ? 'Dashboard.html' : 'Catelog.html';

    } catch (error) {
        console.error("Login error:", error);
        errorMessage.textContent = "Invalid username or password";
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
}

// Attach event listener after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    console.log("Login form event listener attached");
});
