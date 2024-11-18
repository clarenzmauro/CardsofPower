import React, { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { storage, firestore } from './firebaseConfig';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';

import inventoryBg from '../assets/backgrounds/inventory.jpg';
import gold from '../assets/images/gold.png';
import './InventoryPage.css';

function InventoryPage() {
  const { userDocId } = useParams();
  const [inventoryCards, setInventoryCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]); // Filtered inventory based on search
  const [selectedCard, setSelectedCard] = useState(null);
  const [goldCount, setGoldCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(""); // Search query state

  useEffect(() => {
    async function fetchUserData() {
      try {
        const userDocRef = doc(firestore, 'users', userDocId);
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
        const userDocRef = doc(firestore, 'users', userDocId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const inventoryIds = userDoc.data().inventory || [];

          const cardsData = await Promise.all(
            inventoryIds.map(async (cardId) => {
              const cardDocRef = doc(firestore, 'cards', cardId);
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
  .filter((card) => card !== null && typeof card.cardName === 'string') // Ensure valid cardName
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

  // Handle card click
  const handleCardClick = (card) => {
    setSelectedCard(card);
  };

  // Handle search query input
  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter inventory based on card name
    const filtered = inventoryCards.filter((card) =>
      card.cardName.toLowerCase().includes(query)
    );
    setFilteredCards(filtered);
  };

  return (
    <main id="inventory" style={{ backgroundImage: `url(${inventoryBg})` }} className="sm:px-12 lg:px-24">
      <div className="overlay"></div>
      <div className="wrapper sm:pt-4 lg:pt-8">
        <div className="search-bar sm:mb-4 lg:mb-6">
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              fontSize: '16px'
            }}
          />
        </div>

        <div className="cards">
          {filteredCards.map((card) => (
            <div 
              key={card.id} 
              className="card sm:me-2 lg:me-4 mb-4 flex flex-col justify-between" 
              style={{ width: '150px', height: '209px' }} 
              onClick={() => handleCardClick(card)}
            >
              <img src={card.imageUrl} alt={card.cardName || "Card Image"} />
            </div>
          ))}

          <div className="gold-coin">
            <img src={gold} alt="gold coins" />
            <p style={{ color: 'white' }}>{goldCount !== 0 ? goldCount : 0}</p>
          </div>
        </div>

        <div className="lastCard sm:ms-2 lg:ms-4">
          <h1 className="sm:text-4xl lg:text-6xl">Inventory</h1>

          {selectedCard ? (
            <img
              className="sm:w-4/5 lg:w-full mx-auto sm:my-2 lg:my-4"
              src={selectedCard.imageUrl}
              alt={selectedCard.cardName}
              style={{ width: '95%' }}
            />
          ) : (
            <div className="placeholder-card text-center">
              <p className="text-2xl text-white">Please select a card</p>
            </div>
          )}

          <div className="stats sm:text-sm lg:text-2xl flex justify-between sm:w-4/5 lg:w-full mx-auto">
            <div>
              <p className="text-start" style={{ color: 'white' }}>
                Matches: {selectedCard ? selectedCard.cardMatch?.local || 0 : "N/A"}
              </p>
              <p style={{ color: 'white' }}> 
                Win Rate: {selectedCard ? (
                  (selectedCard.cardWin?.local || 0) && (selectedCard.cardMatch?.local || 0)
                    ? ((selectedCard.cardWin.local || 0) / (selectedCard.cardMatch.local || 0) * 100).toFixed(2) + "%"
                    : "0%"
                ) : "N/A"}
              </p>
            </div>

            <div>
              <p style={{ color: 'white' }}>Value: {selectedCard?.marketValue || 0}</p>
              <p className="text-start" style={{ color: 'white' }}>ROI: 
                {
                  (() => {
                    const marketValue = selectedCard?.marketValue || 0;
                    const boughtFor = selectedCard?.boughtFor || 0;

                    const roi = marketValue - boughtFor;

                    if (roi > 0) {
                      return <span className="text-green-500">+{roi}</span>;
                    } else if (roi < 0) {
                      return <span className="text-red-600">-{Math.abs(roi)}</span>;
                    } else {
                      return <span className="text-white">{roi}</span>;
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
