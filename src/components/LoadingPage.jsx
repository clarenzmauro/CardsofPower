import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { firestore } from "./firebaseConfig";
import videoFile from "../assets/backgrounds/loading.mp4";
import "./LoadingPage.css";

const LoadingPage = () => {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }

    const validateDatabase = async () => {
      try {
        // Get all users and cards
        const usersRef = collection(firestore, "users");
        const cardsRef = collection(firestore, "cards");
        const usersSnapshot = await getDocs(usersRef);
        const cardsSnapshot = await getDocs(cardsRef);
        
        const totalUsers = usersSnapshot.size;
        const totalCards = cardsSnapshot.size;
        let processedUsers = 0;
        let processedCards = 0;

        // Create users map for quick lookups
        const usersMap = new Map();
        usersSnapshot.docs.forEach(doc => {
          usersMap.set(doc.id, { ...doc.data(), docId: doc.id });
        });

        // 1. Card Count Validation (0-16.67%)
        setStatusMessage("Checking if users' card count matches their inventory...");
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const currentCardCount = userData.currentCardCount || 0;
          const inventorySize = (userData.inventory || []).length;
          console.log(`[Card Count Check] User: ${userData.username}, Count: ${currentCardCount}, Actual Inventory: ${inventorySize}`);

          if (currentCardCount !== inventorySize) {
            console.error(`[Card Count Mismatch] User: ${userData.username}, Stored Count: ${currentCardCount}, Actual Count: ${inventorySize}`);
            setError(`Card count mismatch for user: ${userData.username}`);
            return;
          }

          processedUsers++;
          setProgress((processedUsers / totalUsers) * 16.67);
        }

        // 2. Friendship Validation (16.67-33.33%)
        setStatusMessage("Validating friendship connections...");
        processedUsers = 0;
        
        // Create a username to user map for quick lookups
        const usernameMap = new Map();
        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          usernameMap.set(data.username, { ...data, docId: doc.id });
        });
        console.log('[Friendship Check] Total users in system:', usernameMap.size);

        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const userFriends = userData.friends || {};
          console.log(`[Friendship Check] User: ${userData.username}, Friends:`, Object.keys(userFriends));

          for (const friendUsername of Object.keys(userFriends)) {
            const friendData = usernameMap.get(friendUsername);
            if (!friendData) {
              console.error(`[Friend Not Found] User: ${userData.username} has non-existent friend: ${friendUsername}`);
              setError(`Non-existent friend found: ${friendUsername}`);
              return;
            }
            
            const friendsFriends = friendData.friends || {};
            if (!friendsFriends[userData.username]) {
              console.error(`[Asymmetric Friendship] ${userData.username} -> ${friendUsername}, but not vice versa`);
              console.error(`${friendUsername}'s friends:`, Object.keys(friendsFriends));
              setError(`Asymmetric friendship detected between ${userData.username} and ${friendUsername}`);
              return;
            }
            console.log(`[Friendship Valid] ${userData.username} <-> ${friendUsername}`);
          }

          processedUsers++;
          setProgress(16.67 + (processedUsers / totalUsers) * 16.67);
        }

        // 3. Game Statistics Validation (33.33-50%)
        setStatusMessage("Verifying game statistics...");
        processedUsers = 0;
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const gamesPlayed = userData.gamesPlayed || 0;
          const gamesWon = userData.gamesWon || 0;
          const gamesLost = userData.gamesLost || 0;
          console.log(`[Game Stats] User: ${userData.username}, Played: ${gamesPlayed}, Won: ${gamesWon}, Lost: ${gamesLost}`);

          if (gamesWon + gamesLost > gamesPlayed) {
            console.error(`[Invalid Game Stats] User: ${userData.username}, Total (${gamesWon + gamesLost}) exceeds played (${gamesPlayed})`);
            setError(`Invalid game statistics for user: ${userData.username}`);
            return;
          }

          processedUsers++;
          setProgress(33.33 + (processedUsers / totalUsers) * 16.67);
        }

        // 4. Card Ownership Validation (50-66.67%)
        setStatusMessage("Validating card ownership data...");
        processedCards = 0;
        for (const cardDoc of cardsSnapshot.docs) {
          const cardData = cardDoc.data();
          console.log(`[Card Ownership] Card: ${cardDoc.id}, Owner: ${cardData.currentOwnerUsername}`);
          
          if (cardData.isOwned) {
            const owner = usersMap.get(cardData.currentOwnerId);
            if (!owner || owner.username !== cardData.currentOwnerUsername) {
              console.error(`[Invalid Card Owner] Card: ${cardDoc.id}, Listed Owner: ${cardData.currentOwnerUsername}, Actual Owner: ${owner?.username || 'Not Found'}`);
              setError(`Invalid card ownership for card: ${cardDoc.id}`);
              return;
            }
          }

          processedCards++;
          setProgress(50 + (processedCards / totalCards) * 16.67);
        }

        // 5. Cross-check Card Ownership (66.67-83.33%)
        setStatusMessage("Cross-checking card ownership with user inventories...");
        processedCards = 0;
        for (const cardDoc of cardsSnapshot.docs) {
          const cardData = cardDoc.data();
          
          if (cardData.isOwned) {
            const owner = usersMap.get(cardData.currentOwnerId);
            console.log(`[Inventory Check] Card: ${cardDoc.id}, Owner: ${cardData.currentOwnerUsername}, In Inventory: ${owner?.inventory?.includes(cardDoc.id)}`);
            
            if (!owner || !(owner.inventory || []).includes(cardDoc.id)) {
              console.error(`[Card-Inventory Mismatch] Card ${cardDoc.id} owned by ${cardData.currentOwnerUsername} but not in their inventory`);
              setError(`Card-inventory mismatch for card: ${cardDoc.id}`);
              return;
            }
          }

          processedCards++;
          setProgress(66.67 + (processedCards / totalCards) * 16.67);
        }

        // 6. Synchronize Card Stats (83.33-100%)
        setStatusMessage("Synchronizing card battle statistics...");
        processedCards = 0;
        for (const cardDoc of cardsSnapshot.docs) {
          const cardData = cardDoc.data();
          console.log(`[Stats Sync] Card: ${cardDoc.id}, ATK: ${cardData.atkPts}, DEF: ${cardData.defPts}`);
          
          await updateDoc(doc(cardsRef, cardDoc.id), {
            inGameAtkPts: cardData.atkPts,
            inGameDefPts: cardData.defPts
          });

          processedCards++;
          setProgress(83.33 + (processedCards / totalCards) * 16.67);
        }

        // All validations passed
        setProgress(100);
        navigate("./login");

      } catch (error) {
        console.error("Validation error:", error);
        setError("An error occurred during validation. Please try again later.");
      }
    };

    validateDatabase();
  }, [navigate]);

  if (error) {
    return (
      <div id="loading">
        <video
          ref={videoRef}
          src={videoFile}
          muted
          loop
          autoPlay
          playsInline
          className="fixed top-0 left-0 w-full h-full object-cover -z-10"
        />
        
        <div className="loading-bar">
          <div 
            className="loading-progress"
            style={{ 
              width: `${Math.min(Math.max(progress, 0), 100)}%`
            }}
          />
        </div>
        
        <div className="status-message">
          <span style={{ color: '#ff4444' }}>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div id="loading">
      <video
        ref={videoRef}
        src={videoFile}
        muted
        loop
        autoPlay
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover -z-10"
      />
      
      <div className="loading-bar">
        <div 
          className="loading-progress" 
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
      
      <div className="status-message">
        {error ? (
          <span style={{ color: '#ff4444' }}>{error}</span>
        ) : (
          <span>{statusMessage}</span>
        )}
      </div>
    </div>
  );
};

export default LoadingPage;
