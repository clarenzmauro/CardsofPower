import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { firestore } from "./firebaseConfig";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import accountImage from "../assets/images/account.png";
import battleImage from "../assets/images/battle.png";
import shopImage from "../assets/images/shop.png";
import inventoryImage from "../assets/images/inventory.png";
import dictionaryImage from "../assets/images/dictionary.png";
import workshopImage from "../assets/images/workshop.png";
import friendsImage from "../assets/images/friends.png";
import loginBackground from "../assets/backgrounds/login.jpg";
import "./HomePage.css";

function HomePage() {
  const { userDocId } = useParams();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const syncCards = async () => {
      if (!userDocId || isSyncing) return;
      
      try {
        setIsSyncing(true);
        const syncToastId = toast.info('Syncing card data...', { 
          autoClose: 3000,
          closeButton: true,
          closeOnClick: true
        });

        // Get user's inventory
        const userDoc = await getDoc(doc(firestore, "users", userDocId));
        if (!userDoc.exists()) {
          toast.dismiss(syncToastId);
          toast.error('User not found', { autoClose: 3000, closeButton: true, closeOnClick: true });
          return;
        }

        const inventory = userDoc.data().inventory || [];
        let processedCount = 0;
        const totalCards = inventory.length;

        // Process each card in the inventory
        for (const cardId of inventory) {
          const cardRef = doc(firestore, "cards", cardId);
          const cardDoc = await getDoc(cardRef);
          
          if (!cardDoc.exists()) continue;
          
          const cardData = cardDoc.data();
          
          // Calculate win rate
          const matches = cardData.cardMatch?.local || 0;
          const wins = cardData.cardWin?.local || 0;
          const winRate = matches === 0 ? 0 : wins / matches;

          // Calculate retention rate
          const passCount = cardData.passCount || 0;
          const marketCount = cardData.marketCount || 0;
          const retentionRate = marketCount === 0 ? 0 : passCount / marketCount;

          // Calculate new market value
          const newMarketValue = 2000 * (1 + (2 * winRate) - (1 * retentionRate));

          // Update card data
          await updateDoc(cardRef, {
            inGameAtkPts: cardData.atkPts,
            inGameDefPts: cardData.defPts,
            marketValue: newMarketValue,
            roi: newMarketValue - (cardData.boughtFor || 0)
          });

          processedCount++;
          if (processedCount % 5 === 0) { // Update toast every 5 cards
            toast.update(syncToastId, {
              render: `Syncing cards... ${processedCount}/${totalCards}`,
              autoClose: 3000,
              closeButton: true,
              closeOnClick: true
            });
          }
        }

        toast.dismiss(syncToastId);
        toast.success('Card sync complete!', { 
          autoClose: 3000,
          closeButton: true,
          closeOnClick: true
        });
      } catch (error) {
        console.error('Error syncing cards:', error);
        toast.dismiss(syncToastId);
        toast.error('Error syncing cards', { 
          autoClose: 3000,
          closeButton: true,
          closeOnClick: true
        });
      } finally {
        setIsSyncing(false);
      }
    };

    syncCards();
  }, [userDocId]);

  return (
    <main
      id="home"
      className="text-center"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={true}
        pauseOnHover={true}
        theme="dark"
        limit={3}
      />
      <div className="overlay"></div>

      <div className="banners">
        <Link to={`/${userDocId}/workshop`}>
          <img src={workshopImage} alt="" />
        </Link>
        <Link to={`/${userDocId}/battlefield`}>
          <img src={battleImage} alt="" />
        </Link>
        <Link to={`/${userDocId}/shop`}>
          <img src={shopImage} alt="" />
        </Link>
      </div>

      <div className="links text-white text-xl">
        <div className="sm:mx-6 lg:mx-12">
          <Link to={`/${userDocId}/inventory`}>
            <img src={inventoryImage} alt="" />
            <p>Inventory</p>
          </Link>
        </div>

        <div className="sm:mx-6 lg:mx-12">
          <Link to={`/${userDocId}/dictionary`}>
            <img src={dictionaryImage} alt="" />
            <p>Dictionary</p>
          </Link>
        </div>

        <div className="sm:mx-6 lg:mx-12">
          <Link to={`/${userDocId}/friends`}>
            <img src={friendsImage} alt="" />
            <p>Friends</p>
          </Link>
        </div>

        <div className="sm:mx-6 lg:mx-12">
          <Link to={`/${userDocId}/account`}>
            <img src={accountImage} alt="" />
            <p>Account</p>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
