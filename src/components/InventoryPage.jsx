import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { storage, firestore } from "./firebaseConfig";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";

import inventoryBg from "../assets/backgrounds/inventory.jpg";
import gold from "../assets/images/gold.png";
import "./InventoryPage.css";

function InventoryPage() {
  const { userDocId } = useParams();
  const [inventoryCards, setInventoryCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null); // Track the selected card
  const [goldCount, setGoldCount] = useState(0);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get user document based on userDocId
        const userDocRef = doc(firestore, "users", userDocId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // Get the goldCount from the user's document, if it exists
          const userData = userDoc.data();
          setGoldCount(userData.goldCount || 0); // Set goldCount to 0 if it's not present
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    fetchUserData();
  }, [userDocId]);

  useEffect(() => {
    async function fetchInventory() {
      try {
        // Get user document based on userDocId
        const userDocRef = doc(firestore, "users", userDocId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const inventoryIds = userDoc.data().inventory || [];

          // Fetch card details from Firestore based on inventoryIds
          const cardsData = await Promise.all(
            inventoryIds.map(async (cardId) => {
              const cardDocRef = doc(firestore, "cards", cardId);
              const cardDoc = await getDoc(cardDocRef);

              if (cardDoc.exists()) {
                const cardData = cardDoc.data();
                const imageRef = storageRef(storage, cardData.imageUrl);
                const imageUrl = await getDownloadURL(imageRef);

                return { ...cardData, imageUrl }; // Return card with image URL
              }
              return null;
            })
          );

          // Filter out any null results (failed fetches) and update state
          setInventoryCards(cardsData.filter((card) => card !== null));
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    }

    fetchInventory();
  }, [userDocId]);

  // Handle selecting a card
  const handleCardClick = (card) => {
    setSelectedCard(card); // Update the selected card in the state
  };

  return (
    <main
      id="inventory"
      style={{ backgroundImage: `url(${inventoryBg})` }}
      className="sm:px-12 lg:px-24"
    >
      <div className="overlay"></div>

      <div className="wrapper sm:pt-4 lg:pt-8 text-white">
        <div className="cards">
          {inventoryCards.map((card) => (
            <div
              key={card.id}
              className="card sm:me-2 lg:me-4 mb-4 flex flex-col justify-between"
              onClick={() => handleCardClick(card)} // Handle click event
            >
              <img src={card.imageUrl} alt={card.cardName || "Card Image"} />

              <div>
                  <p className="sm:text-sm lg:text-xl">{card.cardName}</p>
                  <p className="mb-2 sm:text-sm lg:text-xl">Card ID</p>
                </div>

                <div className="stats sm:text-xs lg:text-base">
                  <div>
                    <p className="text-start">Matches: 30</p>
                    <p>Win Rate: 50%</p>
                  </div>

                  <div>
                    <p>$99</p>
                    {/* positive & negative color styling*/}
                    {/* <p className="text-green-400">+25%</p> */}
                    <p className="text-red-600">-15%</p>
                  </div>
                </div>
            </div>
          ))}
          {/* <div className="gold-coin">
            <img src={gold} alt="gold coins" />
            <p>{goldCount !== 0 ? goldCount : 0}</p>
          </div> */}
        </div>

        <div className="lastCard sm:ms-2 lg:ms-4">
          <h1 className="sm:text-4xl lg:text-6xl text-center">Inventory</h1>

          {/* Display the selected card if there is one, otherwise show the placeholder */}
          {selectedCard ? (
            <img
              className="sm:w-4/5 lg:w-full mx-auto sm:my-2 lg:my-4"
              src={selectedCard.imageUrl}
              alt={selectedCard.cardName}
            />
          ) : (
            <div className="text-center">
              <p className="text-2xl text-white">Please select a card</p>
            </div>
          )}

          <div className="stats sm:text-sm lg:text-2xl flex justify-between sm:w-4/5 lg:w-full mx-auto">
            <div>
              <p className="text-start">
                Matches:{" "}
                {selectedCard ? selectedCard.cardMatch?.local || 0 : "N/A"}
              </p>
              <p>
                Win Rate:{" "}
                {selectedCard
                  ? // Ensure both cardWin and cardMatch have valid values for calculation
                    (selectedCard.cardWin?.local || 0) &&
                    (selectedCard.cardMatch?.local || 0)
                    ? (
                        ((selectedCard.cardWin.local || 0) /
                          (selectedCard.cardMatch.local || 0)) *
                        100
                      ).toFixed(2) + "%"
                    : "0%" // Treat 0 as a valid win rate instead of N/A
                  : "N/A"}
              </p>
            </div>

            <div>
              <p>Value: {selectedCard?.marketValue || 0}</p>
              <p className="text-start">
                ROI:
                {
                  // Calculate the ROI difference between marketValue and boughtFor
                  (() => {
                    const marketValue = selectedCard?.marketValue || 0; // Default to 0 if no value
                    const boughtFor = selectedCard?.boughtFor || 0; // Default to 0 if no value

                    const roi = marketValue - boughtFor; // ROI calculation

                    if (roi > 0) {
                      return <span className="text-green-500">+{roi}</span>; // Positive ROI in green
                    } else if (roi < 0) {
                      return (
                        <span className="text-red-600">-{Math.abs(roi)}</span>
                      ); // Negative ROI in red
                    } else {
                      return <span className="text-white">{roi}</span>; // ROI of 0 in white
                    }
                  })()
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default InventoryPage;
