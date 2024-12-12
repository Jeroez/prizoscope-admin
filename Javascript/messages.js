import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, doc, collection, getDocs, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

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
const chatMessages = document.getElementById('chat-messages');
const chatHeader = document.getElementById('chat-with-user');
const adminMessageInput = document.getElementById('admin-message');

let selectedUser = null;

// Load all users with messages
async function loadUsers() {
    try {
        const chatsCollection = collection(db, "chats");
        const chatDocs = await getDocs(chatsCollection);

        userList.innerHTML = ''; // Clear user list
        chatDocs.forEach(doc => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.textContent = doc.id; // Display user name
            userCard.addEventListener('click', () => loadMessages(doc.id)); // Attach click event
            userList.appendChild(userCard);
        });
    } catch (error) {
        console.error("Error loading users:", error);
    }
}

// Load messages for a specific user
async function loadMessages(userName) {
    try {
        selectedUser = userName;
        chatHeader.textContent = `Chat with ${userName}`;
        chatMessages.innerHTML = ''; // Clear previous messages

        const userDoc = doc(db, "chats", userName);
        const userChat = await getDoc(userDoc);

        if (userChat.exists()) {
            const messages = Object.entries(userChat.data());

            // Sort messages by their keys to maintain order
            messages.sort(([keyA], [keyB]) => extractMessageIndex(keyA) - extractMessageIndex(keyB));

            // Render messages in the chat window
            messages.forEach(([key, value]) => {
                const messageDiv = document.createElement('div');
                messageDiv.className = key.startsWith('user_message') ? 'message user-message' : 'message admin-message';
                messageDiv.textContent = value;
                chatMessages.appendChild(messageDiv);
            });

            // Scroll to the latest message
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            chatMessages.innerHTML = '<p>No messages found for this user.</p>';
        }
    } catch (error) {
        console.error("Error loading messages:", error);
    }
}

// Extract message index for sorting
function extractMessageIndex(messageKey) {
    return parseInt(messageKey.split('_').pop(), 10);
}

// Send admin message
async function sendAdminMessage() {
    try {
        const adminMessage = adminMessageInput.value.trim();
        if (!adminMessage || !selectedUser) return;

        const userDoc = doc(db, "chats", selectedUser);
        const userChat = await getDoc(userDoc);

        // Get the message count to determine the next message key
        const messageCount = Object.keys(userChat.data() || {}).length || 0;
        const newMessageKey = `admin_message_${messageCount + 1}`;

        // Update Firebase with the new message
        await updateDoc(userDoc, { [newMessageKey]: adminMessage });

        adminMessageInput.value = ''; // Clear input field
        loadMessages(selectedUser); // Refresh the chat window
    } catch (error) {
        console.error("Error sending message:", error);
    }
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
