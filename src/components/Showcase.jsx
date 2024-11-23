import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storage, firestore } from "./firebaseConfig";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";

function Showcase() {
  const { userDocId } = useParams();
  const [inventoryCards, setInventoryCards] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const userDocRef = doc(firestore, "users", userDocId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const inventoryIds = userDoc.data().inventory || [];

          const cardsData = await Promise.all(
            inventoryIds.map(async (cardId) => {
              const cardDocRef = doc(firestore, "cards", cardId);
              const cardDoc = await getDoc(cardDocRef);

              if (cardDoc.exists()) {
                const cardData = cardDoc.data();
                const imageRef = storageRef(storage, cardData.imageUrl);
                const imageUrl = await getDownloadURL(imageRef);

                return { ...cardData, imageUrl };
              }
              return null;
            })
          );

          // Filter out null cards
          const validCards = cardsData.filter((card) => card !== null);
          setInventoryCards(validCards);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };

    fetchInventory();
  }, [userDocId]);

  const handleContinue= () => {
    navigate(`/${userDocId}/home`)
};

  return (
    <main id="showcase" className="text-center">
      <h1 className="text-4xl my-4">Showcase</h1>

      <div className="card-grid">
        {inventoryCards.length > 0 ? (
          inventoryCards.map((card, index) => (
            <div key={index} className="card-display">
              <img
                className="mx-auto"
                src={card.imageUrl}
                alt={card.cardName || "Card Image"}
              />
              <h2 className="mt-4">{card.cardName || "Unnamed Card"}</h2>
              <button onClick={handleContinue}>Click to Continue</button>
            </div>
          ))
        ) : (
          <p className="text-xl text-white mt-4">
            No cards available in inventory.
          </p>
        )}
      </div>
    </main>
  );
}

export default Showcase;
