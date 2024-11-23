import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { storage, firestore } from "./firebaseConfig";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";

import inventoryBg from "../assets/backgrounds/inventory.jpg";
import gold from "../assets/images/gold.png";
import "./InventoryPage.css";

function InventoryPage() {
  const { userDocId } = useParams();
  const [inventoryCards, setInventoryCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null); // Track the selected card
  const [goldCount, setGoldCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(""); // Search query state

  const winRate = selectedCard
    ? // Ensure both cardWin and cardMatch have valid values for calculation
      (selectedCard.cardWin?.local || 0) && (selectedCard.cardMatch?.local || 0)
      ? (
          ((selectedCard.cardWin.local || 0) /
            (selectedCard.cardMatch.local || 0)) *
          100
        ).toFixed(2) + "%"
      : "0%" // Treat 0 as a valid win rate instead of N/A
    : "N/A";

  const marketValue = selectedCard?.marketValue || 0; // Default to 0 if no value
  const boughtFor = selectedCard?.boughtFor || 0; // Default to 0 if no value
  const roi = marketValue - boughtFor; // ROI calculation

  // Determine the formatted ROI with color
  const formattedROI = (() => {
    if (roi > 0) {
      return <span className="text-green-500">+{roi}</span>; // Positive ROI in green
    } else if (roi < 0) {
      return <span className="text-red-600">-{Math.abs(roi)}</span>; // Negative ROI in red
    } else {
      return <span>{roi}</span>; // ROI of 0 in default color
    }
  })();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const userDocRef = doc(firestore, "users", userDocId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setGoldCount(userData.goldCount || 0);
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

          const validCards = cardsData
            .filter(
              (card) => card !== null && typeof card.cardName === "string"
            ) // Ensure valid cardName
            .sort((a, b) => a.cardName.localeCompare(b.cardName)); // Use the correct method: localeCompare

          setInventoryCards(validCards);
          setFilteredCards(validCards); // Initialize filteredCards with all cards
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

  // Handle search query input
  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter inventory based on card name
    const filtered = inventoryCards.filter((card) =>
      card.cardName.toLowerCase().startsWith(query)
    );
    setFilteredCards(filtered);
  };

  return (
    <main
      id="inventory"
      style={{ backgroundImage: `url(${inventoryBg})` }}
      className="sm:px-12 lg:px-24"
    >
      <Link to={`/${userDocId}/home`} className="back-button">
        <i className="fas fa-reply back-icon"></i>
      </Link>
      
      <div className="overlay"></div>

      <div className="wrapper sm:pt-4 lg:pt-12 text-white">
        <div className="cards">
          <div className="mb-4 flex justify-between">
            <h1 className="sm:text-4xl lg:text-6xl">
              Inventory
            </h1>

            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={handleSearch}
              class="px-4 sm:me-5 lg:me-12 bg-transparent border-2 rounded-xl outline-none"
            ></input>
          </div>

          <div className="collection pb-4 flex">
            <div className="gold my-auto">
              <img className="w-full" src={gold} alt="gold coins" />
              <p className="sm:text-2xl lg:text-3xl text-center">{goldCount !== 0 ? goldCount : 0}</p>
            </div>

            {filteredCards.map((card) => (
              <img
                src={card.imageUrl}
                alt={card.cardName || "Card Image"}
                onClick={() => handleCardClick(card)}
                className="card"
              />
            ))}
          </div>
        </div>

        <div className="lastCard sm:ms-2 lg:ms-4">
          {/* Display the selected card if there is one, otherwise show the placeholder */}
          {selectedCard ? (
            <>
              <img
                className="mx-auto w-4/5 sm:my-2 lg:my-4"
                src={selectedCard.imageUrl}
                alt={selectedCard.cardName}
              />

              <div className="stats sm:text-sm lg:text-2xl flex justify-between sm:w-4/5 lg:w-full mx-auto">
                <div>
                  <p>
                    Matches:{" "}
                    {selectedCard ? selectedCard.cardMatch?.local || 0 : "N/A"}
                  </p>
                  <p>Win Rate: {winRate}</p>
                </div>

                <div>
                  <p>Value: {selectedCard?.marketValue || 0}</p>
                  <p className="text-start">ROI: {formattedROI}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-2xl text-center">Please select a card</p>
          )}
        </div>
      </div>
    </main>
  );
}

export default InventoryPage;
