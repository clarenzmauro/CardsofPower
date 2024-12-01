import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import './UsersEntries.css';

function UsersEntries() {
  const [users, setUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch active users
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);

        // Fetch banned users
        const bannedCollection = collection(db, 'banned');
        const bannedSnapshot = await getDocs(bannedCollection);
        const bannedData = bannedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBannedUsers(bannedData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [db]);

  const handleBan = async (user) => {
    try {
      // 1. Add user data to 'banned' collection exactly as is
      await setDoc(doc(db, 'banned', user.id), user);

      // 2. Remove user from 'users' collection
      await deleteDoc(doc(db, 'users', user.id));

      // 3. Update local state
      setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));
      setBannedUsers(prevBanned => [...prevBanned, user]);

    } catch (error) {
      console.error("Error banning user:", error);
      alert("Failed to ban user. Please try again.");
    }
  };

  const handleUnban = async (user) => {
    try {
      // 1. Move user back to 'users' collection exactly as is
      await setDoc(doc(db, 'users', user.id), user);

      // 2. Remove from 'banned' collection
      await deleteDoc(doc(db, 'banned', user.id));

      // 3. Update local state
      setBannedUsers(prevBanned => prevBanned.filter(u => u.id !== user.id));
      setUsers(prevUsers => [...prevUsers, user]);

    } catch (error) {
      console.error("Error unbanning user:", error);
      alert("Failed to unban user. Please try again.");
    }
  };

  if (loading) {
    return <div>Loading users data...</div>;
  }

  const allUsers = [...users, ...bannedUsers];

  return (
    <div className="users-entries">
      {allUsers.map((user) => (
        <div key={user.id} className="user-card">
          <div className="user-image">
            <img 
              src={`/src/assets/profile/${user.profPicUrl}`} 
              alt={user.username} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/src/assets/profile/default.jpg';
              }}
            />
          </div>
          <div className="user-info">
            <h2>{user.username}</h2>
            <div className="user-details">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Date Created:</strong> {user.dateCreated?.toDate().toLocaleDateString()}</p>
              <p><strong>Games Played:</strong> {user.gamesPlayed}</p>
              <p><strong>Games Won:</strong> {user.gamesWon}</p>
              <p><strong>Games Lost:</strong> {user.gamesLost}</p>
              <p><strong>Gold Count:</strong> {user.goldCount}</p>
              <p><strong>Highest Card Count:</strong> {user.highestCardCount}</p>
              <p><strong>Highest Gold Count:</strong> {user.highestGoldCount}</p>
              <p><strong>Current Card Count:</strong> {user.currentCardCount}</p>
            </div>
            <button 
              className={bannedUsers.some(u => u.id === user.id) ? "unban-button" : "ban-button"}
              onClick={() => bannedUsers.some(u => u.id === user.id) ? handleUnban(user) : handleBan(user)}
            >
              {bannedUsers.some(u => u.id === user.id) ? 'Unban' : 'Ban'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UsersEntries; 
