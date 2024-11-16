import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    collection,
    getDoc,
    doc,
    getDocs,
    query,
    where,
    addDoc,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { firestore } from "./firebaseConfig";
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
            const fetchedCards = await Promise.all(
                cardsSnapshot.docs.map(async (doc) => {
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

    const handleLeftSectionClick = () => {
        fetchUserCards();
        setShowOverlay(true);
    };

    const closeOverlay = () => {
        setShowOverlay(false);
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
        return totalUsers > 0 ? (100 - ((passCount / totalUsers) * 100)).toFixed(2) : 0;
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
    
            // Notify success
            alert("Card posted successfully!");
        } catch (err) {
            console.error("Error posting card:", err);
            setError("An error occurred while posting the card. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRightSectionClick = async () => {
        setIsLoading(true);
        setError(null);
        setShowRightOverlay(true);
    
        try {
            const cardsCollectionRef = collection(firestore, "cards");
            const q = query(cardsCollectionRef, where("currentOwnerId", "!=", userDocId));
            const cardsSnapshot = await getDocs(q);
    
            const storage = getStorage();
            const fetchedCards = await Promise.all(
                cardsSnapshot.docs.map(async (doc) => {
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
    
            // Notify success
            alert("Trade posted successfully!");
            setSelectedCard(null);
            setSelectedCardToGet(null);
        } catch (err) {
            console.error("Error posting trade:", err);
            setError("An error occurred while posting the trade. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="listing-page">
            <header className="header">
                <nav className="nav-tabs">
                    <div className="tab">Shop</div>
                    <div className="tab">Trades</div>
                    <div className="tab">Listing</div>
                </nav>
            </header>

            <div className="top-buttons">
                <button
                    className={`action-button ${viewMode === "sell" ? "active" : ""}`}
                    onClick={() => setViewMode("sell")}
                >
                    Sell
                </button>
                <button
                    className={`action-button ${viewMode === "trade" ? "active" : ""}`}
                    onClick={() => setViewMode("trade")}
                >
                    Trade
                </button>
            </div>

            {viewMode === "sell" && (
                <div className="sell-layout">
                    <div className="content-sections">
                        <button className="left-section" onClick={handleLeftSectionClick}>
                            {selectedCard ? (
                                <>
                                    <img
                                        src={selectedCard.imageUrl}
                                        alt={`Card ${selectedCard.id}`}
                                        className="selected-card-image"
                                    />
                                    <button
                                        className="close-button"
                                        onClick={handleCloseSelectedCard}
                                    >
                                        Close
                                    </button>
                                </>
                            ) : (
                                "View My Cards"
                            )}
                        </button>

                        {selectedCard && (
                            <div className="middle-section">
                                <h2>{selectedCard.cardName}</h2>
                                <p><strong>Card Id:</strong> {selectedCard.id}</p>
                                <h3>Game Stats</h3>
                                <p><strong>Total Matches Played:</strong> {selectedCard.cardMatch?.global || 0}</p>
                                <p><strong>Total Wins:</strong> {selectedCard.cardWin?.global || 0}</p>
                                <p><strong>Total Losses:</strong> {selectedCard.cardLose?.global || 0}</p>
                                <p><strong>Card Winrate:</strong> {calculateWinRate(selectedCard.cardMatch, selectedCard.cardWin)}%</p>
                                <p><strong>Card Retention Rate:</strong> {calculateRetentionRate(selectedCard.passCount)}%</p>
                                <h3>Investment Stats</h3>
                                <p><strong>Bought For:</strong> ${selectedCard.boughtFor || 0}</p>
                                <p><strong>ROI:</strong> {selectedCard.roi || 0}%</p>
                                <p><strong>Market Value:</strong> ${selectedCard.marketValue || 0}</p>
                            </div>
                        )}
                    </div>
                    <button
                        className="post-button"
                        onClick={handlePost}
                        disabled={!selectedCard} // Disable the button if no card is selected
                    >
                        Post
                    </button>
                </div>
            )}

            {viewMode === "trade" && (
                <div className="trade-layout">
                    <button className="trade-left-section" onClick={handleLeftSectionClick}>
                            {selectedCard ? (
                                <>
                                    <img
                                        src={selectedCard.imageUrl}
                                        alt={`Card ${selectedCard.id}`}
                                        className="selected-card-image"
                                    />
                                    <button
                                        className="close-button"
                                        onClick={handleCloseSelectedCard}
                                    >
                                        Close
                                    </button>
                                </>
                            ) : (
                                "Card To Give"
                            )}
                    </button>
                        <button
                            className={`trade-middle-button ${!selectedCard || !selectedCardToGet ? "disabled" : ""}`}
                            onClick={handleTrade}
                            disabled={!selectedCard || !selectedCardToGet} // Disable if either card is not selected
                        >
                            Trade
                        </button>
                    <button className="trade-right-section" onClick={handleRightSectionClick}>
                            {selectedCardToGet ? (
                                <>
                                    <img
                                        src={selectedCardToGet.imageUrl}
                                        alt={`Card ${selectedCardToGet.id}`}
                                        className="selected-card-image"
                                    />
                                    <button
                                        className="close-button"
                                        onClick={handleCloseSelectedCardToGet}
                                    >
                                        Close
                                    </button>
                                </>
                            ) : (
                                "Card To Get"
                            )}
                    </button>   
                </div>
            )}

            {showOverlay && (
                <div className="overlay">
                    <div className="overlay-content">
                        <button className="close-button" onClick={closeOverlay}>
                            Close
                        </button>
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : error ? (
                            <p className="error">{error}</p>
                        ) : (
                            <div className="cards-container">
                                {cards.map((card) => (
                                    <div
                                        key={card.id}
                                        className="card"
                                        onClick={() => handleCardClick(card)}
                                    >
                                        <img
                                            src={card.imageUrl}
                                            alt={`Card ${card.id}`}
                                            className="card-image"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

{showRightOverlay && (
    <div className="overlay">
        <div className="overlay-content">
            <button className="close-button" onClick={() => setShowRightOverlay(false)}>
                Close
            </button>
            {isLoading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : (
                <div className="cards-container">
                    {availableCards.map((card) => (
                        <div
                            key={card.id}
                            className="card"
                            onClick={() => handleCardToGetClick(card)}
                        >
                            <img
                                src={card.imageUrl}
                                alt={`Card ${card.id}`}
                                className="card-image"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
)}          
        </div>
    );
};

export default ListingPage;
