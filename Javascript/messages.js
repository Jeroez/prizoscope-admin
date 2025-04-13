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
const adminStore = admin?.Store || null;

if (!isSuperAdmin && !adminStore) {
    alert("Error: No store assigned to this admin.");
    window.location.href = "index.html"; // Redirect to login if session data is invalid
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
            const [userName, chatAdmin] = chatDocName.split("|").map(str => str.trim());

            if (isSuperAdmin || chatAdmin === adminStore || userName === adminStore) {
                const userCard = document.createElement('div');
                userCard.className = 'user-card';
                userCard.textContent = isSuperAdmin ? chatDocName : userName;

                userCard.addEventListener('click', () => {
                    loadMessages(chatDocName);
                });

                userList.appendChild(userCard);
            }
        });

    } catch (error) {
        console.error("Error loading user chats:", error);
    }
}



// Load messages for selected user
async function loadMessages(chatId) {
    try {
        selectedChat = chatId;
        const chatDocRef = doc(db, "chats", chatId);
        const chatSnapshot = await getDoc(chatDocRef);

        chatMessages.innerHTML = "";
        chatHeader.textContent = `Chat with ${chatId.split(" | ")[0]}`;
        
        if (!chatSnapshot.exists()) {
            console.error("Chat not found or no access.");
            return;
        }
        const messages = chatSnapshot.data() || {};
                const sortedMessages = Object.entries(messages).sort(([keyA], [keyB]) =>
            extractMessageIndex(keyA) - extractMessageIndex(keyB)
        );

        sortedMessages.forEach(([key, message]) => {
            const sender = message.sender === "admin" ? "admin" : "user";
            displayMessage(message, sender);
        });

    } catch (error) {
        console.error("Error loading messages:", error);
    }
}


// Display messages (Handles Text and Images)
function displayMessage(message, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender === "admin" ? "admin-message" : "user-message");

    if (typeof message === "object" && message.type === "image") {
        //  Handle images properly
        const image = document.createElement("img");
        image.src = message.content;
        image.alt = "Sent Image";
        image.classList.add("chat-image");
        messageElement.appendChild(image);
    } else {
        // Handle text messages
        messageElement.textContent = typeof message === "string" ? message : message.content;
    }

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
}



// Check if URL is an image
function isValidImageUrl(url) {
    // Remove Discord’s temporary tokens
    if (url.includes("discordapp.com/attachments/")) {
        url = url.split("?")[0]; // Removes everything after `?`
    }

    return url.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i) !== null;
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

        // Prevent normal admins from sending messages to unauthorized chats
        const [userName, chatAdmin] = selectedChat.split(" | ");
        if (!isSuperAdmin && chatAdmin !== adminStore) {
            alert("You do not have permission to send messages in this chat.");
            return;
        }

        const chatDocRef = doc(db, "chats", selectedChat);
        const chatSnapshot = await getDoc(chatDocRef);

        const messageCount = Object.keys(chatSnapshot.data() || {}).length || 0;
        const newMessageKey = `message_${messageCount + 1}`;

        await updateDoc(chatDocRef, {
            [newMessageKey]: {
                content: adminMessage,
                sender: "admin",
                timestamp: Date.now(),
                type: "text"
            }
        });

        adminMessageInput.value = "";
        loadMessages(selectedChat);
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

window.logout = () => {
    sessionStorage.removeItem('admin');
    window.location.href = "index.html";
};


window.sendAdminMessage = sendAdminMessage;
window.loadUsers = loadUsers;
window.loadMessages = loadMessages;
