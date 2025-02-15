import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', loadUsers);

const userList = document.getElementById('user-list');
const chatMessages = document.getElementById('chat-messages');
const chatHeader = document.getElementById('chat-with-user');
const adminMessageInput = document.getElementById('admin-message');

let selectedChat = null;

// Load user chats based on admin access
async function loadUsers() {
    try {
        const chatsCollection = collection(db, "chats");
        const querySnapshot = await getDocs(chatsCollection);
        userList.innerHTML = '';

        querySnapshot.forEach(docSnapshot => {
            const chatDocName = docSnapshot.id;
            const [userName, chatAdmin] = chatDocName.split(" | ");

            // Super Admin sees all chats; Store Admin sees only their store's chats
            if (isSuperAdmin || chatAdmin === adminStore) {
                const userCard = document.createElement('div');
                userCard.className = 'user-card';
                userCard.textContent = userName;
                userCard.addEventListener('click', () => loadMessages(chatDocName));
                userList.appendChild(userCard);
            }
        });

    } catch (error) {
        console.error("Error loading user chats:", error);
    }
}


// Load messages for selected user
async function loadUsers() {
    try {
        const chatsCollection = collection(db, "chats");
        const querySnapshot = await getDocs(chatsCollection);
        userList.innerHTML = '';

        querySnapshot.forEach(docSnapshot => {
            const chatDocName = docSnapshot.id;
            const [userName, chatAdmin] = chatDocName.split(" | ");

            // Create the user card
            const userCard = document.createElement('div');
            userCard.className = 'user-card';

            if (isSuperAdmin) {
                userCard.textContent = chatDocName; 
            } else if (chatAdmin === adminStore) {
                userCard.textContent = userName; 
            } else {
                return;
            }

            userCard.addEventListener('click', () => loadMessages(chatDocName));
            userList.appendChild(userCard);
        });

    } catch (error) {
        console.error("Error loading user chats:", error);
    }
}


// Extract message index from key
function extractMessageIndex(messageKey) {
    return parseInt(messageKey.split('_').pop(), 10);
}

// Send admin message
async function sendAdminMessage() {
    try {
        const adminMessage = adminMessageInput.value.trim();
        if (!adminMessage || !selectedChat) return;

        const chatDocRef = doc(db, "chats", selectedChat);
        const chatSnapshot = await getDoc(chatDocRef);

        const messageCount = Object.keys(chatSnapshot.data() || {}).length || 0;
        const newMessageKey = `admin_message_${messageCount + 1}`;

        await updateDoc(chatDocRef, { [newMessageKey]: adminMessage });

        adminMessageInput.value = '';
        loadMessages(selectedChat);
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

window.sendAdminMessage = sendAdminMessage;
window.loadUsers = loadUsers;
