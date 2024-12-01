import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc, Timestamp, updateDoc, getDoc } from 'firebase/firestore';
import './WorkshopEntries.css';

function WorkshopEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const fetchEntries = async () => {
      const workshopCollection = collection(db, 'workshop');
      const workshopSnapshot = await getDocs(workshopCollection);
      const workshopData = workshopSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntries(workshopData);
      setLoading(false);
    };

    fetchEntries();
  }, [db]);

  const handleAccept = async (entry) => {
    try {
      // 1. Remove from workshop collection
      await deleteDoc(doc(db, 'workshop', entry.id));

      // 2. Add to cards collection (excluding creatorId and creatorName)
      const { creatorId, creatorName, ...cardData } = entry;
      const cardsRef = collection(db, 'cards');
      await addDoc(cardsRef, cardData);

      // 3. Update creator's goldCount
      const creatorRef = doc(db, 'users', creatorId);
      const creatorDoc = await getDoc(creatorRef);
      if (creatorDoc.exists()) {
        const currentGold = creatorDoc.data().goldCount || 0;
        await updateDoc(creatorRef, {
          goldCount: currentGold + 1000
        });
      }

      // 4. Send acceptance mail
      await addDoc(collection(db, 'mail'), {
        mailContent: "The developers have accepted your card entry. As compensation, you have received 1000 Gold",
        mailReceiver: creatorId,
        mailSender: "SYSTEM",
        mailSent: Timestamp.now(),
        isFriendRequest: false,
        isGifted: {
          cardId: "",
          cardName: "",
          isIt: false
        }
      });

      // Update local state
      setEntries(prevEntries => prevEntries.filter(e => e.id !== entry.id));

    } catch (error) {
      console.error("Error accepting workshop entry:", error);
      alert("Failed to accept workshop entry. Please try again.");
    }
  };

  const handleReject = async (entry) => {
    try {
      // 1. Remove from workshop collection
      await deleteDoc(doc(db, 'workshop', entry.id));

      // 2. Send rejection mail
      await addDoc(collection(db, 'mail'), {
        mailContent: "The developers have rejected your card entry. Try again next time",
        mailReceiver: entry.creatorId,
        mailSender: "SYSTEM",
        mailSent: Timestamp.now(),
        isFriendRequest: false,
        isGifted: {
          cardId: "",
          cardName: "",
          isIt: false
        }
      });

      // Update local state
      setEntries(prevEntries => prevEntries.filter(e => e.id !== entry.id));

    } catch (error) {
      console.error("Error rejecting workshop entry:", error);
      alert("Failed to reject workshop entry. Please try again.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="workshop-entries">
      {entries.map((entry) => (
        <div key={entry.id} className="card-entry">
          <div className="card-image">
            <img src={entry.imageUrl} alt={entry.cardName} />
          </div>
          <div className="card-info">
            <h2>{entry.cardName}</h2>
            
            <div className="card-stats">
              <div className="stat-row">
                <span>Type: {entry.cardType}</span>
                <span>Class: {entry.cardClass}</span>
              </div>
              <div className="stat-row">
                <span>Character: {entry.cardCharacter}</span>
                <span>Attribute: {entry.cardAttribute}</span>
              </div>
              <div className="stat-row">
                <span>Level: {entry.cardLevel}</span>
                <span>ATK/DEF: {entry.atkPts}/{entry.defPts}</span>
              </div>
            </div>

            <div className="card-creator">
              <div>Creator: {entry.creatorName}</div>
            </div>

            <div className="card-actions">
              <button 
                onClick={() => handleAccept(entry)} 
                className="accept-btn"
              >
                Accept
              </button>
              <button 
                onClick={() => handleReject(entry)} 
                className="reject-btn"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default WorkshopEntries; 
