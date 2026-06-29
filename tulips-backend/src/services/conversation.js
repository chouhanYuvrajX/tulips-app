const { db } = require('./firebase.js');

// Firebase se conversation history laana (Vora purani baatein yaad karega)
async function getHistory(conversationId) {
    const ref = db.ref(`conversations/${conversationId}/messages`);
    // Sirf last 20 messages la rahe hain taaki AI confuse na ho aur fast chale
    const snapshot = await ref.limitToLast(20).once('value'); 
    
    if (!snapshot.exists()) {
        return [];
    }

    const messages = [];
    snapshot.forEach((childSnapshot) => {
        messages.push(childSnapshot.val());
    });
    
    return messages;
}

// Firebase mein nayi message save karna (Vora nayi baatein yaad rakhega)
async function addMessage(conversationId, role, content) {
    const ref = db.ref(`conversations/${conversationId}/messages`);
    await ref.push({ role, content });
}

module.exports = {
    getHistory,
    addMessage
};