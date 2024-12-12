import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, doc, collection, getDocs, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', loadUsers);

const userList = document.getElementById('user-list');
const chatContainer = document.getElementById('chat-container');
const chatMessages = document.getElementById('chat-messages');
const chatHeader = document.getElementById('chat-header');
const adminMessageInput = document.getElementById('admin-message');

let selectedUser = null;

// Load all users with messages
async function loadUsers() {
    const chatsCollection = collection(db, "chats");
    const chatDocs = await getDocs(chatsCollection);

    userList.innerHTML = '';
    chatDocs.forEach(doc => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.textContent = doc.id; // User's name (document ID)
        userCard.onclick = () => loadMessages(doc.id);

        userList.appendChild(userCard);
    });
}

// Load messages for a specific user
async function loadMessages(userName) {
    selectedUser = userName;
    chatHeader.textContent = `Chat with ${userName}`;
    chatMessages.innerHTML = '';
    chatContainer.classList.remove('hidden');

    const userDoc = doc(db, "chats", userName);
    const userChat = await getDoc(userDoc);

    if (userChat.exists()) {
        const messages = Object.entries(userChat.data());
        messages.sort(([keyA], [keyB]) => extractMessageIndex(keyA) - extractMessageIndex(keyB));

        messages.forEach(([key, value]) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = key.startsWith('user_message') ? 'user-message' : 'admin-message';
            messageDiv.textContent = value;

            chatMessages.appendChild(messageDiv);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
    } else {
        chatMessages.innerHTML = '<p>No messages found for this user.</p>';
    }
}

// Extract message index for sorting
function extractMessageIndex(messageKey) {
    return parseInt(messageKey.split('_').pop(), 10);
}

// Send admin message
async function sendAdminMessage() {
    const adminMessage = adminMessageInput.value.trim();
    if (!adminMessage || !selectedUser) return;

    const userDoc = doc(db, "chats", selectedUser);
    const userChat = await getDoc(userDoc);

    const messageCount = Object.keys(userChat.data() || {}).length || 0;
    const newMessageKey = `admin_message_${messageCount + 1}`;

    await updateDoc(userDoc, { [newMessageKey]: adminMessage });
    adminMessageInput.value = '';
    loadMessages(selectedUser);
}

// Search for users
function searchUsers() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const userCards = document.querySelectorAll('.user-card');

    userCards.forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(query) ? 'block' : 'none';
    });
}

window.sendAdminMessage = sendAdminMessage;

