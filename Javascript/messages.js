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

async function loadUsers() {
    try {
        const chatsCollection = collection(db, "chats");
        const chatDocs = await getDocs(chatsCollection);

        userList.innerHTML = '';
        chatDocs.forEach(doc => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.textContent = doc.id;
            userCard.addEventListener('click', () => loadMessages(doc.id));
            userList.appendChild(userCard);
        });
    } catch (error) {
        console.error("Error loading users:", error);
    }
}

async function loadMessages(userName) {
    try {
        selectedUser = userName;
        chatHeader.textContent = `Chat with ${userName}`;
        chatMessages.innerHTML = ''; 

        const userDoc = doc(db, "chats", userName);
        const userChat = await getDoc(userDoc);

        if (userChat.exists()) {
            const messages = Object.entries(userChat.data());

            messages.sort(([keyA], [keyB]) => extractMessageIndex(keyA) - extractMessageIndex(keyB));

            messages.forEach(([key, value]) => {
                const messageDiv = document.createElement('div');
                messageDiv.className = key.startsWith('user_message') ? 'message user-message' : 'message admin-message';
                
                if (isImageUrl(value)) {
                    const imgElement = document.createElement('img');
                    imgElement.src = value;
                    imgElement.alt = "Image";
                    imgElement.className = 'chat-image'; 
                    messageDiv.appendChild(imgElement);
                } else {
                    messageDiv.textContent = value;
                }
                
                chatMessages.appendChild(messageDiv);
            });

            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            chatMessages.innerHTML = '<p>No messages found for this user.</p>';
        }
    } catch (error) {
        console.error("Error loading messages:", error);
    }
}

function isImageUrl(url) {
    return /\.(jpeg|jpg|gif|png|webp|svg)$/.test(url);
}

function extractMessageIndex(messageKey) {
    return parseInt(messageKey.split('_').pop(), 10);
}

async function sendAdminMessage() {
    try {
        const adminMessage = adminMessageInput.value.trim();
        if (!adminMessage || !selectedUser) return;

        const userDoc = doc(db, "chats", selectedUser);
        const userChat = await getDoc(userDoc);

        const messageCount = Object.keys(userChat.data() || {}).length || 0;
        const newMessageKey = `admin_message_${messageCount + 1}`;

        await updateDoc(userDoc, { [newMessageKey]: adminMessage });

        adminMessageInput.value = '';
        loadMessages(selectedUser);
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

function searchUsers() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const userCards = document.querySelectorAll('.user-card');

    userCards.forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(query) ? 'block' : 'none';
    });
}

window.sendAdminMessage = sendAdminMessage;
