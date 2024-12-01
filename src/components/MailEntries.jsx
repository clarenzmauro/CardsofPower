import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { firestore } from './firebaseConfig';
import './MailEntries.css';

function MailEntries() {
  const [message, setMessage] = useState('');
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          username: doc.data().username
        }));
        setAllUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserSelect = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSend = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      alert("Please select at least one user or choose 'Send to All Users'");
      return;
    }

    const confirmMessage = sendToAll 
      ? "Are you sure you want to send this message to ALL users?" 
      : `Are you sure you want to send this message to ${selectedUsers.length} selected user(s)?`;

    if (window.confirm(confirmMessage)) {
      try {
        const recipients = sendToAll ? allUsers : selectedUsers;
        
        await Promise.all(recipients.map(user => 
          addDoc(collection(firestore, 'mail'), {
            mailContent: message,
            mailReceiver: user.id,
            mailSender: "SYSTEM",
            mailSent: Timestamp.now(),
            isFriendRequest: false,
            isGifted: {
              cardId: "",
              cardName: "",
              isIt: false
            }
          })
        ));

        setMessage('');
        setSelectedUsers([]);
        alert('Message sent successfully!');
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
      }
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="mail-entries">
      <div className="mail-form">
        <textarea
          value={message}
          onChange={(e) => {
            if (e.target.value.length <= 100) {
              setMessage(e.target.value);
            }
          }}
          placeholder="Type your announcement message..."
          maxLength={100}
        />
        <div className="character-count">
          {message.length}/100 characters
        </div>

        <div className="send-options">
          <label className="send-all-checkbox">
            <input
              type="checkbox"
              checked={sendToAll}
              onChange={(e) => {
                setSendToAll(e.target.checked);
                if (e.target.checked) {
                  setSelectedUsers([]);
                }
              }}
            />
            Send to All Users
          </label>

          {!sendToAll && (
            <div className="users-checkbox-list">
              <div className="selected-count">
                Selected Users: {selectedUsers.length}
              </div>
              {allUsers.map(user => (
                <label key={user.id} className="user-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedUsers.some(u => u.id === user.id)}
                    onChange={() => handleUserSelect(user)}
                  />
                  {user.username}
                </label>
              ))}
            </div>
          )}
        </div>

        <button 
          className="send-button"
          onClick={handleSend}
        >
          Send Announcement
        </button>
      </div>
    </div>
  );
}

export default MailEntries; 
