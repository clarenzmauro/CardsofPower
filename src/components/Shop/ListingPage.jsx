//
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  collection,
  getDoc,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { firestore } from "../firebaseConfig";
import ShopPageContext from "./ShopPageContext";
import TradePageContext from "./TradePageContext";
import shop from "../../assets/images/shop-sign.png";
import trade from "../../assets/images/trade.png";
import listing from "../../assets/images/listing.png";
import inventoryBg from "../../assets/backgrounds/inventory.jpg";
import "./ListingPage.css";

const ListingPage = () => {
  const { userDocId } = useParams();
  const [cards, setCards] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedCardToGet, setSelectedCardToGet] = useState(null); // Card to get
  const [showRightOverlay, setShowRightOverlay] = useState(false); // Overlay for right section
  const [availableCards, setAvailableCards] = useState([]); // Cards fetched for "Card to Get"
  const [shopHistory, setShopHistory] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);

  const [viewMode, setViewMode] = useState("sell"); // New state to toggle between layouts

  const fetchTotalUsersCount = async () => {
    try {
      const usersCollectionRef = collection(firestore, "users");
      const usersSnapshot = await getDocs(usersCollectionRef);
      setTotalUsers(usersSnapshot.size);
    } catch (err) {
      console.error("Error fetching users count:", err);
    }
  };

  useEffect(() => {
    fetchTotalUsersCount();
  }, []);

  const fetchUserCards = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userDocRef = doc(firestore, "users", userDocId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setError("User not found.");
        setCards([]);
        return;
      }

      const userData = userDocSnap.data();
      const inventory = userData.inventory || [];

      if (inventory.length === 0) {
        setError("No cards in inventory.");
        setCards([]);
        return;
      }

      const cardsCollectionRef = collection(firestore, "cards");
      const q = query(cardsCollectionRef, where("__name__", "in", inventory));
      const cardsSnapshot = await getDocs(q);

      const storage = getStorage();
      const filteredCards = cardsSnapshot.docs.filter((doc) => {
        const cardData = doc.data();
        return cardData.isListed !== true;
      });
      const fetchedCards = await Promise.all(
        filteredCards.map(async (doc) => {
          const cardData = doc.data();
          const imageRef = ref(storage, cardData.imageUrl);
          const imageUrl = await getDownloadURL(imageRef);

          return {
            id: doc.id,
            ...cardData,
            imageUrl,
          };
        })
      );

      setCards(fetchedCards);
    } catch (err) {
      console.error("Error fetching cards:", err);
      setError("An error occurred while fetching cards.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShopHistory();
  }, [userDocId]);

  useEffect(() => {
    fetchTradeHistory();
  }, [userDocId]);

  const handleLeftSectionClick = () => {
    fetchUserCards();
    setShowOverlay(true);
  };

  const closeOverlay = () => {
    setShowOverlay(false);
    setShowRightOverlay(false);
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowOverlay(false);
  };

  const handleCloseSelectedCard = () => {
    setSelectedCard(null);
  };

  const calculateWinRate = (cardMatch, cardWin) => {
    const totalMatches = cardMatch?.global || 0;
    const totalWins = cardWin?.global || 0;
    return totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(2) : 0;
  };

  const calculateRetentionRate = (passCount) => {
    return totalUsers > 0
      ? (100 - (passCount / totalUsers) * 100).toFixed(2)
      : 0;
  };

  const handlePost = async () => {
    if (!selectedCard) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get the seller's name from the "users" collection
      const userDocRef = doc(firestore, "users", userDocId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("Seller not found.");
      }

      const sellerData = userDocSnap.data();
      const sellerName = sellerData.username || "Unknown Seller";

      // Add a new document to the "shop" collection
      const shopCollectionRef = collection(firestore, "shop");
      const datePosted = new Date();

      const newShopItem = {
        buyerId: "", // Remain empty
        buyerName: "", // Remain empty
        datePosted, // Timestamp when button is clicked
        isStillAvailable: true, // Set to true
        sellerId: userDocId, // Extracted from URL
        sellerName, // Retrieved from the user's document
        sellingCardId: selectedCard.id, // Selected card's ID
        sellingCardName: selectedCard.cardName, // Selected card's name
        sellingCardUrl: selectedCard.imageUrl, // Selected card's image URL
        sellingPrice: selectedCard.marketValue, // Selected card's market value
      };

      // Add the document to Firestore
      await addDoc(shopCollectionRef, newShopItem);

      const cardRef = doc(firestore, "cards", selectedCard.id);
      await updateDoc(cardRef, {
        marketCount: (selectedCard.marketCount || 0) + 1,
        isListed: true,
      });

      const sellerRef = doc(firestore, "users", userDocId);
      const userDocSnapForSeller = await getDoc(sellerRef); // Re-fetch seller data to get current cardsListed

      if (userDocSnapForSeller.exists()) {
        const userData = userDocSnapForSeller.data();
        const currentCardsListed = userData.cardsListed || 0;
        await updateDoc(sellerRef, {
          cardsListed: currentCardsListed + 1, // Increment the cardsListed field
        });
      }

      // Notify success
      alert("Card posted successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error posting card:", err);
      setError("An error occurred while posting the card. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCard = async (cardId, cardDetails) => {
    try {
      const cardDocRef = doc(firestore, "shop", cardId);
      await deleteDoc(cardDocRef);

      const cardRef = doc(firestore, "cards", cardDetails.id);
      await updateDoc(cardRef, {
        marketCount: Math.max((cardDetails.marketCount || 1) - 1, 0),
        isListed: false,
      });

      alert("Card removed successfully!");

      // Update the shop history state after deletion
      setShopHistory((prevHistory) =>
        prevHistory.filter((item) => item.id !== cardId)
      );
    } catch (err) {
      console.error("Error removing card:", err);
      alert("Failed to remove card. Please try again.");
    }
  };

  const handleRemoveTrade = async (tradeId, cardDetails) => {
    try {
      // Delete the trade history document from the "trades" collection
      const tradeDocRef = doc(firestore, "trades", tradeId);
      await deleteDoc(tradeDocRef);

      // Update the card to give (decrease market count and mark as not listed)
      const cardGiveRef = doc(firestore, "cards", cardDetails.cardGiveId);
      await updateDoc(cardGiveRef, {
        marketCount: Math.max((cardDetails.cardGiveMarketCount || 1) - 1, 0),
        isListed: false,
      });

      // Update the card to receive (decrease market count and mark as not listed)
      const cardReceiveRef = doc(firestore, "cards", cardDetails.cardReceiveId);
      await updateDoc(cardReceiveRef, {
        marketCount: Math.max((cardDetails.cardReceiveMarketCount || 1) - 1, 0),
        isListed: false,
      });

      alert("Trade history removed successfully!");

      // Update the trade history state after deletion
      setTradeHistory((prevHistory) =>
        prevHistory.filter((item) => item.id !== tradeId)
      );
    } catch (err) {
      console.error("Error removing trade history:", err);
      alert("Failed to remove trade history. Please try again.");
    }
  };

  const handleRightSectionClick = async () => {
    setIsLoading(true);
    setError(null);
    setShowRightOverlay(true);

    try {
      const cardsCollectionRef = collection(firestore, "cards");
      const q = query(
        cardsCollectionRef,
        where("currentOwnerId", "!=", userDocId)
      );
      const cardsSnapshot = await getDocs(q);

      const storage = getStorage();

      const filteredCards = cardsSnapshot.docs.filter((doc) => {
        const cardData = doc.data();
        return cardData.isListed !== true;
      });

      const fetchedCards = await Promise.all(
        filteredCards.map(async (doc) => {
          const cardData = doc.data();
          const imageRef = ref(storage, cardData.imageUrl);
          const imageUrl = await getDownloadURL(imageRef);

          return {
            id: doc.id,
            ...cardData,
            imageUrl,
          };
        })
      );

      setAvailableCards(fetchedCards);
    } catch (err) {
      console.error("Error fetching cards:", err);
      setError("An error occurred while fetching cards.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardToGetClick = (card) => {
    setSelectedCardToGet(card);
    setShowRightOverlay(false); // Close the overlay after selection
  };

  const handleCloseSelectedCardToGet = () => {
    setSelectedCardToGet(null);
  };

  const handleTrade = async () => {
    if (!selectedCard || !selectedCardToGet) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch trade giver's name
      const userDocRef = doc(firestore, "users", userDocId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("Trade giver not found.");
      }

      const tradeGiverData = userDocSnap.data();
      const tradeGiverName = tradeGiverData.username || "Unknown User";

      // Prepare trade data
      const tradeData = {
        cardGiveId: selectedCard.id,
        cardGiveName: selectedCard.cardName,
        cardGiveUrl: selectedCard.imageUrl,
        cardReceiveId: selectedCardToGet.id,
        cardReceiveName: selectedCardToGet.cardName,
        cardReceiveUrl: selectedCardToGet.imageUrl,
        datePosted: new Date(),
        isTradeActive: true,
        tradeGiverId: userDocId,
        tradeGiverName,
        tradeReceiverId: "",
        tradeReceiverName: "",
      };

      // Add to trades collection in Firestore
      const tradesCollectionRef = collection(firestore, "trades");
      await addDoc(tradesCollectionRef, tradeData);

      const cardRef = doc(firestore, "cards", selectedCard.id);
      await updateDoc(cardRef, {
        marketCount: (selectedCard.marketCount || 0) + 1,
      });

      const sellerRef = doc(firestore, "users", userDocId);
      const userDocSnapForSeller = await getDoc(sellerRef); // Re-fetch seller data to get current cardsListed

      if (userDocSnapForSeller.exists()) {
        const userData = userDocSnapForSeller.data();
        const currentCardsListed = userData.cardsListed || 0;
        await updateDoc(sellerRef, {
          cardsListed: currentCardsListed + 1, // Increment the cardsListed field
        });
      }

      const cardGiveRef = doc(firestore, "cards", selectedCard.id);
      await updateDoc(cardGiveRef, {
        isListed: true,
      });

      const cardReceiveRef = doc(firestore, "cards", selectedCardToGet.id);
      await updateDoc(cardReceiveRef, {
        isListed: true,
      });

      // Notify success
      alert("Trade posted successfully!");
      setSelectedCard(null);
      setSelectedCardToGet(null);
      window.location.reload();
    } catch (err) {
      console.error("Error posting trade:", err);
      setError("An error occurred while posting the trade. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShopHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const shopCollectionRef = collection(firestore, "shop");
      const q = query(shopCollectionRef, where("sellerId", "==", userDocId));
      const shopSnapshot = await getDocs(q);

      const historyData = shopSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setShopHistory(historyData);
    } catch (err) {
      console.error("Error fetching shop history:", err);
      setError("An error occurred while fetching shop history.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTradeHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const shopCollectionRef = collection(firestore, "trades");
      const q = query(
        shopCollectionRef,
        where("tradeGiverId", "==", userDocId)
      );
      const shopSnapshot = await getDocs(q);

      const historyData = shopSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTradeHistory(historyData);
    } catch (err) {
      console.error("Error fetching shop history:", err);
      setError("An error occurred while fetching shop history.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="listing-page"
      style={{ backgroundImage: `url(${inventoryBg})` }}
      className="text-white"
    >
      <Link to={`/${userDocId}/home`} className="back-button">
        <i className="fas fa-reply back-icon"></i>
      </Link>

      <div className="overlay"></div>

      <nav className="flex w-1/2 mx-auto h-1/5">
        <Link to={`/${userDocId}/shop`}>
          <img className="filter grayscale" src={shop} alt="" />
        </Link>
        <Link to={`/${userDocId}/shop/trades`}>
          <img className="filter grayscale" src={trade} alt="" />
        </Link>
        <Link to={`/${userDocId}/shop/listing`}>
          <img src={listing} alt="" />
        </Link>
      </nav>

      {viewMode === "sell" && (
        <main>
          {/* Listing Panel */}
          <section className="listingPanel sm:p-3 lg:p-5">
            <select
              className="bg-white py-2 rounded-lg text-black"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option className="text-center" value="sell">
                Sell
              </option>
              <option className="text-center" value="trade">
                Trade
              </option>
            </select>

            {/* Popup */}
            <button onClick={handleLeftSectionClick}>
              {selectedCard ? (
                <>
                  <img
                    className="hidden lg:block w-full"
                    src={selectedCard.imageUrl}
                    alt={`Card ${selectedCard.id}`}
                  />
                  <button onClick={handleCloseSelectedCard}>Remove</button>
                </>
              ) : (
                "View My Cards"
              )}
            </button>

            {/* Info */}
            {selectedCard && (
              <div className="sm:text-sm lg:text-lg">
                <p>
                  Wins: {selectedCard.cardWin?.global || 0}/
                  {selectedCard.cardMatch?.global || 0}
                </p>
                <p>
                  Winrate:{" "}
                  {calculateWinRate(
                    selectedCard.cardMatch,
                    selectedCard.cardWin
                  )}
                  %
                </p>
                <p>
                  Retention Rate:{" "}
                  {calculateRetentionRate(selectedCard.passCount)}%
                </p>

                <hr className="my-2" />
                <p>Bought For: ${selectedCard.boughtFor || 0}</p>
                <p>Market Value: ${selectedCard.marketValue || 0}</p>
                <p>ROI: {selectedCard.roi || 0}%</p>
              </div>
            )}

            <button
              className="bg-white py-2 rounded-lg text-black"
              onClick={handlePost}
              disabled={!selectedCard} // Disable the button if no card is selected
            >
              Post
            </button>
          </section>

          {/* Display */}
          <section className="shop-history p-5">
            <h3 className="lg:text-4xl">Shop History</h3>

            <div className="cards">
              {shopHistory.length > 0 ? (
                shopHistory.map((item) => (
                  <div key={item.id}>
                    <ShopPageContext
                      asset={{
                        imageUrl: item.sellingCardUrl,
                        cardName: item.sellingCardName,
                      }}
                      sellerName={item.sellerName}
                      buttonText="Remove"
                      onButtonClick={() =>
                        handleRemoveCard(item.id, {
                          id: item.sellingCardId,
                          marketCount: item.marketCount || 0,
                        })
                      }
                    />
                  </div>
                ))
              ) : (
                <p>No shop history found.</p>
              )}
            </div>
          </section>
        </main>
      )}

      {viewMode === "trade" && (
        <main>
          {/* Listing Panel */}
          <section className="listingPanel sm:p-3 lg:p-5">
            <select
              className="bg-white py-2 rounded-lg text-black"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option className="text-center" value="sell">
                Sell
              </option>
              <option className="text-center" value="trade">
                Trade
              </option>
            </select>

            <button onClick={handleLeftSectionClick}>
              {selectedCard ? (
                <>
                  <p>Card To Give</p>
                  <img
                    className="sm:w-1/3 lg:w-2/3 mx-auto"
                    src={selectedCard.imageUrl}
                    alt={`Card ${selectedCard.id}`}
                  />
                  <button onClick={handleCloseSelectedCard}>Remove</button>
                </>
              ) : (
                "Card To Give"
              )}
            </button>

            <button onClick={handleRightSectionClick}>
              {selectedCardToGet ? (
                <>
                  <p>Card To Give</p>
                  <img
                    className="sm:w-1/3 lg:w-2/3 mx-auto"
                    src={selectedCardToGet.imageUrl}
                    alt={`Card ${selectedCardToGet.id}`}
                  />
                  <button onClick={handleCloseSelectedCardToGet}>Remove</button>
                </>
              ) : (
                "Card To Get"
              )}
            </button>

            <button
              className="bg-white py-2 rounded-lg text-black"
              onClick={handleTrade}
              disabled={!selectedCard || !selectedCardToGet} // Disable if either card is not selected
            >
              Trade
            </button>
          </section>

          {/* Display */}
          <section className="shop-history p-5">
            <h3 className="lg:text-4xl">Trade History</h3>

            <div className="cards">
              {tradeHistory.length > 0 ? (
                tradeHistory.map((item) => (
                  <div key={item.id}>
                    <TradePageContext
                      cardToGive={{
                        cardGiveId: item.cardGiveId,
                        cardGiveName: item.cardGiveName,
                        cardGiveUrl: item.cardGiveUrl,
                      }}
                      cardToGet={{
                        cardReceiveId: item.cardReceiveId,
                        cardReceiveName: item.cardReceiveName,
                        cardReceiveUrl: item.cardReceiveUrl,
                      }}
                      tradeGiverName={item.tradeGiverName}
                      onTrade={() =>
                        handleRemoveTrade(item.id, {
                          cardGiveId: item.cardGiveId,
                          cardReceiveId: item.cardReceiveId,
                          cardGiveMarketCount: item.cardGiveMarketCount || 1,
                          cardReceiveMarketCount:
                            item.cardReceiveMarketCount || 1,
                        })
                      }
                    />
                  </div>
                ))
              ) : (
                <p>No shop history found.</p>
              )}
              {tradeHistory.length > 0 ? (
                tradeHistory.map((item) => (
                  <div key={item.id}>
                    <TradePageContext
                      cardToGive={{
                        cardGiveId: item.cardGiveId,
                        cardGiveName: item.cardGiveName,
                        cardGiveUrl: item.cardGiveUrl,
                      }}
                      cardToGet={{
                        cardReceiveId: item.cardReceiveId,
                        cardReceiveName: item.cardReceiveName,
                        cardReceiveUrl: item.cardReceiveUrl,
                      }}
                      tradeGiverName={item.tradeGiverName}
                      onTrade={() =>
                        handleRemoveTrade(item.id, {
                          cardGiveId: item.cardGiveId,
                          cardReceiveId: item.cardReceiveId,
                          cardGiveMarketCount: item.cardGiveMarketCount || 1,
                          cardReceiveMarketCount:
                            item.cardReceiveMarketCount || 1,
                        })
                      }
                    />
                  </div>
                ))
              ) : (
                <p>No shop history found.</p>
              )}
              {tradeHistory.length > 0 ? (
                tradeHistory.map((item) => (
                  <div key={item.id}>
                    <TradePageContext
                      cardToGive={{
                        cardGiveId: item.cardGiveId,
                        cardGiveName: item.cardGiveName,
                        cardGiveUrl: item.cardGiveUrl,
                      }}
                      cardToGet={{
                        cardReceiveId: item.cardReceiveId,
                        cardReceiveName: item.cardReceiveName,
                        cardReceiveUrl: item.cardReceiveUrl,
                      }}
                      tradeGiverName={item.tradeGiverName}
                      onTrade={() =>
                        handleRemoveTrade(item.id, {
                          cardGiveId: item.cardGiveId,
                          cardReceiveId: item.cardReceiveId,
                          cardGiveMarketCount: item.cardGiveMarketCount || 1,
                          cardReceiveMarketCount:
                            item.cardReceiveMarketCount || 1,
                        })
                      }
                    />
                  </div>
                ))
              ) : (
                <p>No shop history found.</p>
              )}
            </div>
          </section>
        </main>
      )}

      {showOverlay && (
        <div className="cards-overlay p-5">
          <button className="block ms-auto" onClick={closeOverlay}>
            Close
          </button>

          <div>
            {cards.map((card) => (
              <img
                src={card.imageUrl}
                alt={`Card ${card.id}`}
                key={card.id}
                onClick={() => handleCardClick(card)}
                className="p-2"
              />
            ))}
          </div>
        </div>
      )}

      {showRightOverlay && (
        <div className="cards-overlay p-5">
          <button className="block ms-auto" onClick={closeOverlay}>
            Close
          </button>

          <div>
            {availableCards.map((card) => (
              <img
                src={card.imageUrl}
                alt={`Card ${card.id}`}
                key={card.id}
                onClick={() => handleCardToGetClick(card)}
                className="p-2"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingPage;
