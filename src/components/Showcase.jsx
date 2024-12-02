import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { storage, firestore } from "./firebaseConfig";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import loginBackground from "../assets/backgrounds/login.jpg";
import "./Showcase.css";

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

  const handleContinue = () => {
    navigate(`/${userDocId}/home`);
  };

  return (
    <main
      id="showcase"
      className="text-white text-center mx-auto"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="overlay"></div>

      <div>
        <h1 className="text-xl lg:text-5xl lg:mb-4">
          Ahoy, Buccaneer! Begin Yer Quest with 10 Free Cards!
        </h1>
        <button onClick={handleContinue}>Click here to continue</button>
      </div>

      <div className="cards">
        {inventoryCards.length > 0 ? (
          inventoryCards.map((card, index) => (
            <img src={card.imageUrl} alt={card.cardName || "Card Image"} />
          ))
        ) : (
          <p className="w-full">No cards available in inventory.</p>
        )}
      </div>
    </main>
  );
}

export default Showcase;
