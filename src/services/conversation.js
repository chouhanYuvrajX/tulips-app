const { db } = require('./firebase.js');

// Firebase se conversation history laana (Vora purani baatein yaad karega)
// Stopgap namespacing until real Firebase Auth-based userId lands (frontend task F2)
async function getHistory(userId, conversationId) {
    const ref = db.ref(`conversations/${userId}/${conversationId}/messages`);
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
// Stopgap namespacing until real Firebase Auth-based userId lands (frontend task F2)
async function addMessage(userId, conversationId, role, content) {
    const ref = db.ref(`conversations/${userId}/${conversationId}/messages`);
    await ref.push({ role, content });
}

module.exports = {
    getHistory,
    addMessage
};
