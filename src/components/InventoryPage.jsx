//card.imageUrl = link of images
//card.cardName = cardName
//card.id = documentId

//this code takes the documentId from the url into the params to compare in the database
import React, { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import { storage, firestore } from './firebaseConfig';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

import inventoryBg from '../assets/backgrounds/inventory.jpg';
import './InventoryPage.css'

// Change:
import placeholderCard from '../assets/cards/Divine/Ixchel.png';

function InventoryPage() {
  const { userDocId } = useParams();
  const [inventoryCards, setInventoryCards] = useState([]);

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

          setInventoryCards(cardsData.filter((card) => card !== null));
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    }

    fetchInventory();
  }, [userDocId]);

  return (
    <main id="inventory" style={{ backgroundImage: `url(${inventoryBg})` }} className="sm:px-12 lg:px-24">
      <div className="overlay"></div>

      <div className="wrapper sm:pt-4 lg:pt-8">
        <div className="cards">
          {inventoryCards.map((card) => (
            <div key={card.id} className="card sm:me-2 lg:me-4 mb-4 flex flex-col justify-between">
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
        </div>

        <div className="lastCard sm:ms-2 lg:ms-4">
          <h1 className="sm:text-4xl lg:text-6xl">Inventory</h1>

          <img className="sm:w-4/5 lg:w-full mx-auto sm:my-2 lg:my-4" src={ placeholderCard } alt="" />

          <div className="stats sm:text-sm lg:text-2xl flex justify-between sm:w-4/5 lg:w-full mx-auto">
            <div>
              <p className="text-start">Matches: 30</p>
              <p>Win Rate: 50%</p>
            </div>

            <div>
              <p>$99</p>
              {/* positive & negative */}
              {/* <p className="text-green-400">+25%</p> */}
              <p className="text-red-600">-15%</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default InventoryPage;
