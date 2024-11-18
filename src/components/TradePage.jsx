import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc, arrayRemove, arrayUnion, deleteDoc, increment, getDoc } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom'; // To extract userDocId from the URL
import TradePageContext from './TradePageContext';

// Main component for Trade Page
const TradePage = () => {
  const [trades, setTrades] = useState([]);
  const { userDocId: tradeReceiverId } = useParams(); // Extract userDocId from the URL as tradeReceiverId
  const currentUserDocId = "someCurrentUserDocId"; // This should be the logged-in user's ID

  // Fetch username from Firestore
  const fetchUsername = async (userDocId) => {
    const db = getFirestore();
    const userRef = doc(db, 'users', userDocId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data().username; // Assuming the field name is 'username'
    } else {
      console.log('No such user!');
      return null; // Return null if no username is found
    }
  };

  useEffect(() => {
    const fetchTrades = async () => {
        try {
            const db = getFirestore();
            const tradesCollection = collection(db, 'trades');
            const tradeDocs = await getDocs(tradesCollection);

            const tradesData = tradeDocs.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Filter out trades where tradeGiverId matches the tradeReceiverId (userDocId from URL)
            const filteredTrades = tradesData.filter((trade) => trade.tradeGiverId !== tradeReceiverId);

            setTrades(filteredTrades); // Update the state with filtered trades
        } catch (error) {
            console.error('Error fetching trades:', error);
        }
    };

    fetchTrades();
  }, [tradeReceiverId]);

  // Function to handle trade when "Trade" button is clicked
  const handleTrade = async (trade) => {
    try {
      const db = getFirestore();

      // Fetch usernames for trade giver and receiver
      const tradeReceiverUsername = await fetchUsername(tradeReceiverId);
      const tradeGiverUsername = await fetchUsername(trade.tradeGiverId);

      if (!tradeReceiverUsername || !tradeGiverUsername) {
        console.error('Username not found');
        return; // Exit if any username is not found
      }

      // TRADE RECEIVER LOGIC
      const tradeReceiverRef = doc(db, 'users', tradeReceiverId);
      const cardReceiveId = trade.cardReceiveId; // Card the receiver is trading
      const cardGiveId = trade.cardGiveId; // Card the receiver gets

      // Update the trade receiver's inventory and cardsTraded
      await updateDoc(tradeReceiverRef, {
        cardsTraded: increment(1),
        inventory: arrayUnion(cardGiveId), // Add cardGiveId to inventory
      });

      // Remove cardReceiveId from the trade receiver's inventory
      await updateDoc(tradeReceiverRef, {
        inventory: arrayRemove(cardReceiveId),
      });

      // Update the cardGiveId in the 'cards' collection
      const cardGiveRef = doc(db, 'cards', cardGiveId);
      await updateDoc(cardGiveRef, {
        currentOwnerId: tradeReceiverId,
        currentOwnerUsername: tradeReceiverUsername,
        isListed: false,
        passCount: increment(1), // Increment passCount
      });

      // TRADE GIVER LOGIC
      const tradeGiverRef = doc(db, 'users', trade.tradeGiverId);

      // Update the trade giver's inventory and cardsTraded
      await updateDoc(tradeGiverRef, {
        cardsTraded: increment(1),
        inventory: arrayUnion(cardReceiveId), // Add cardReceiveId to inventory
      });

      // Remove cardGiveId from the trade giver's inventory
      await updateDoc(tradeGiverRef, {
        inventory: arrayRemove(cardGiveId),
      });

      // Update the cardReceiveId in the 'cards' collection
      const cardReceiveRef = doc(db, 'cards', cardReceiveId);
      await updateDoc(cardReceiveRef, {
        currentOwnerId: trade.tradeGiverId,
        currentOwnerUsername: tradeGiverUsername,
        isListed: false,
        passCount: increment(1),
      });

      // DELETE TRADE DOCUMENT
      const tradeRef = doc(db, 'trades', trade.id);
      await deleteDoc(tradeRef);

      // Remove the trade from the local state
      setTrades((prevTrades) => prevTrades.filter((t) => t.id !== trade.id));

      alert('Trade completed successfully!');
    } catch (error) {
      console.error('Error completing trade:', error);
    }
  };

  return (
    <div>
      {trades.map((trade) => (
        <TradePageContext
          key={trade.id}
          cardToGive={{
            cardGiveId: trade.cardGiveId,
            cardGiveName: trade.cardGiveName,
            cardGiveUrl: trade.cardGiveUrl,
          }}
          cardToGet={{
            cardReceiveId: trade.cardReceiveId,
            cardReceiveName: trade.cardReceiveName,
            cardReceiveUrl: trade.cardReceiveUrl,
          }}
          tradeGiverName={trade.tradeGiverName}
          onTrade={() => handleTrade(trade)} // Pass the trade handler as a prop
        />
      ))}
    </div>
  );
};

export default TradePage;
