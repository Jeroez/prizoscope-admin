import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', loadMessages);

function loadMessages() {
    const messagesGrid = document.getElementById('messages-grid');
    const messagesRef = ref(db, 'messages');

    onValue(messagesRef, (snapshot) => {
        messagesGrid.innerHTML = '';
        const messages = snapshot.val();

        if (messages) {
            Object.keys(messages).forEach(key => {
                const message = messages[key];

                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>${message.username}</h3>
                    <p>${message.content}</p>
                    <button onclick="showDeletePopup('${key}')">Delete</button>
                `;

                messagesGrid.appendChild(card);
            });
        } else {
            messagesGrid.innerHTML = '<p class="text-gray-500">No messages found.</p>';
        }
    });
}

let messageToDelete = null;

window.showDeletePopup = (messageId) => {
    messageToDelete = messageId;
    document.getElementById('delete-popup').style.display = 'flex';
};

window.closeDeletePopup = () => {
    document.getElementById('delete-popup').style.display = 'none';
    messageToDelete = null;
};

window.confirmDeleteMessage = () => {
    if (messageToDelete) {
        const messageRef = ref(db, `messages/${messageToDelete}`);
        remove(messageRef)
            .then(() => {
                alert("Message deleted successfully!");
                closeDeletePopup();
            })
            .catch((error) => {
                console.error("Error deleting message:", error);
                alert("Failed to delete the message. Please try again.");
            });
    }
};

window.searchMessages = () => {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const username = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = username.includes(query) ? 'block' : 'none';
    });
};
