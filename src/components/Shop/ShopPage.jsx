import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  arrayRemove,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "../firebaseConfig";
import ShopPageContext from "./ShopPageContext"; // Ensure you're importing the right component
import shop from "../../assets/images/shop-sign.png";
import trade from "../../assets/images/trade.png";
import listing from "../../assets/images/listing.png";
import inventoryBg from "../../assets/backgrounds/inventory.jpg";
import "./ShopPage.css";

const ShopPage = () => {
  const [shopItems, setShopItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]); // For filtered results
  const [searchQuery, setSearchQuery] = useState(""); // Search bar state
  const [minPrice, setMinPrice] = useState(""); // Minimum price filter
  const [maxPrice, setMaxPrice] = useState(""); // Maximum price filter
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userDocId } = useParams(); // Get the buyer's userDocId from the URL

  useEffect(() => {
    const fetchShopItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const shopCollectionRef = collection(firestore, "shop");
        const snapshot = await getDocs(shopCollectionRef);
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          };
        });
        setShopItems(items);
        setFilteredItems(items); // Initialize with all items
      } catch (err) {
        console.error("Error fetching shop items:", err);
        setError("An error occurred while loading the shop.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchShopItems();
  }, []);

  // Filter items based on search query, price range, and seller
  useEffect(() => {
    const filterItems = () => {
      const filtered = shopItems.filter((item) => {
        const matchesSearch = item.sellingCardName
          ?.toLowerCase()
          .startsWith(searchQuery.toLowerCase());
        const matchesPrice =
          (!minPrice || item.sellingPrice >= parseFloat(minPrice)) &&
          (!maxPrice || item.sellingPrice <= parseFloat(maxPrice));
        const isNotSeller = item.sellerId !== userDocId; // Exclude seller's own items
        return matchesSearch && matchesPrice && isNotSeller;
      });
      setFilteredItems(filtered);
    };

    filterItems();
  }, [searchQuery, minPrice, maxPrice, shopItems, userDocId]);

  const handlePurchase = async (item) => {
    const buyerRef = doc(firestore, "users", userDocId); // Buyer reference
    const sellerRef = doc(firestore, "users", item.sellerId); // Seller reference
    const cardRef = doc(firestore, "cards", item.sellingCardId); // Card reference
    const shopItemRef = doc(firestore, "shop", item.id); // Shop item reference

    try {
      // Fetch buyer and seller data
      const buyerDoc = await getDoc(buyerRef);
      const buyerData = buyerDoc.data();
      const buyerGold = buyerData.goldCount;
      const buyerInventory = buyerData.inventory;
      const buyerCurrentCardCount = buyerData.currentCardCount;
      const buyerHighestCardCount = buyerData.highestCardCount;

      const sellerDoc = await getDoc(sellerRef);
      const sellerData = sellerDoc.data();
      const sellerGold = sellerData.goldCount;
      const sellerInventory = sellerData.inventory;
      const sellerCurrentCardCount = sellerData.currentCardCount;

      // Check if buyer has enough gold
      if (buyerGold >= item.sellingPrice) {
        // Proceed with the transaction
        const newBuyerGold = buyerGold - item.sellingPrice;
        const newSellerGold = sellerGold + item.sellingPrice;

        // Update seller's inventory (remove the item)
        await updateDoc(sellerRef, {
          goldCount: newSellerGold,
          inventory: arrayRemove(item.sellingCardId), // Remove from seller's inventory
          currentCardCount: sellerCurrentCardCount - 1, // Decrease seller's card count by 1
        });

        // Update buyer's inventory (add the item)
        await updateDoc(buyerRef, {
          cardsBought: (item.cardsBought || 0) + 1,
          goldCount: newBuyerGold,
          inventory: arrayUnion(item.sellingCardId), // Add to buyer's inventory
          currentCardCount: buyerCurrentCardCount + 1, // Increase buyer's card count by 1
        });

        // Update the card details in the cards collection
        await updateDoc(cardRef, {
          marketCount: (item.marketCount || 0) + 1,
          passCount: (item.passCount || 0) + 1, // Increment passCount
          currentOwnerUsername: buyerData.username, // Update current owner username
          currentOwnerId: userDocId, // Update current owner ID
          boughtFor: item.sellingPrice, // Set the price at which the card was bought
        });

        // Check if buyer's currentCardCount exceeds highestCardCount
        if (buyerCurrentCardCount + 1 > buyerHighestCardCount) {
          await updateDoc(buyerRef, {
            highestCardCount: buyerCurrentCardCount + 1, // Update highestCardCount if needed
          });
        }

        // Delete the item from the shop collection after the purchase
        await deleteDoc(shopItemRef);

        alert(`You successfully bought ${item.sellingCardName}!`);
        window.location.reload();
      } else {
        alert("You do not have enough gold to make this purchase.");
      }
    } catch (err) {
      console.error("Error during purchase:", err);
      alert("An error occurred while processing the transaction.");
    }
  };

  if (isLoading) {
    return <p>Loading shop items...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <main
      id="shop"
      style={{ backgroundImage: `url(${inventoryBg})` }}
      className="text-white"
    >
      <Link to={`/${userDocId}/home`} className="back-button">
        <i className="fas fa-reply back-icon"></i>
      </Link>

      <div className="overlay"></div>

      <nav className="flex w-1/2 mx-auto h-1/5">
        <Link to={`/${userDocId}/shop`}>
          <img src={shop} alt="" />
        </Link>
        <Link to={`/${userDocId}/shop/trades`}>
          <img className="filter grayscale" src={trade} alt="" />
        </Link>
        <Link to={`/${userDocId}/shop/listing`}>
          <img className="filter grayscale" src={listing} alt="" />
        </Link>
      </nav>

      <div className="shop">
        <div className="flex justify-center mb-2 text-black pt-5">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 rounded-s-lg"
          />
          <input
            type="number"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="p-2 border-x-2"
          />
          <input
            type="number"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="p-2 rounded-e-lg"
          />
        </div>

        <div className="cards">
          {filteredItems.map((item) => (
            <div key={item.id}>
              <ShopPageContext
                key={item.id}
                asset={{
                  imageUrl: item.sellingCardUrl || "default_image_url.png", // Fallback URL
                  cardName: item.sellingCardName || "Unnamed Card", // Fallback name
                }}
                sellerName={item.sellerName || "Unknown Seller"}
                buttonText={`$${item.sellingPrice || 0}`}
                onButtonClick={() => handlePurchase(item)} // Pass the item for purchase
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default ShopPage;
