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

          if (currentCardCount !== inventorySize) {
            setError("Anomalies have been found. Please wait for maintenance");
            return;
          }

          processedUsers++;
          setProgress((processedUsers / totalUsers) * 16.67);
        }

        // 2. Friendship Validation (16.67-33.33%)
        setStatusMessage("Validating friendship connections...");
        processedUsers = 0;
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const userFriends = userData.friends || [];

          for (const friendId of userFriends) {
            const friendData = usersMap.get(friendId);
            if (!friendData || !(friendData.friends || []).includes(userDoc.id)) {
              setError("Anomalies have been found. Please wait for maintenance");
              return;
            }
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

          if (gamesWon + gamesLost > gamesPlayed) {
            setError("Anomalies have been found. Please wait for maintenance");
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
          
          if (cardData.isOwned) {
            const owner = usersMap.get(cardData.currentOwnerId);
            if (!owner || owner.username !== cardData.currentOwnerUsername) {
              setError("Anomalies have been found. Please wait for maintenance");
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
            if (!owner || !(owner.inventory || []).includes(cardDoc.id)) {
              setError("Anomalies have been found. Please wait for maintenance");
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
      <main id="loading" className="flex flex-col items-center justify-center">
        <video
          ref={videoRef}
          src={videoFile}
          muted
          autoPlay
          loop
          playsInline
          className="w-screen h-screen object-cover absolute top-0 left-0 -z-10"
        />
        <div className="text-white text-xl font-bold">{error}</div>
      </main>
    );
  }

  return (
    <main id="loading" className="flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        src={videoFile}
        muted
        autoPlay
        loop
        playsInline
        className="w-screen h-screen object-cover absolute top-0 left-0 -z-10"
      />
      <div className="loading-bar">
        <div
          className="loading-progress"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="status-message">
        {statusMessage}
      </div>
    </main>
  );
};

export default LoadingPage;
