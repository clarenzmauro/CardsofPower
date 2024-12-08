import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { firestore, storage } from "./firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import dictionaryBg from "../assets/backgrounds/dictionary.jpg";
import "./InventoryPage.css";

function DictionaryPage() {
  const { userDocId } = useParams();
  const [allCards, setAllCards] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cardType, setCardType] = useState(""); // For "Card Type" dropdown
  const [cardAttribute, setCardAttribute] = useState(""); // For "Card Attribute" dropdown
  const [cardClass, setCardClass] = useState(""); // For "Card Class" dropdown
  const [cardCharacter, setCardCharacter] = useState(""); // For "Card Character" dropdown
  const [cardLevel, setCardLevel] = useState(""); // For "Card Level" number input
  const [selectedCard, setSelectedCard] = useState(null); // Track the selected card
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [loadedCards, setLoadedCards] = useState(0);

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
    const fetchInventoryAndCards = async () => {
      try {
        setIsLoading(true);
        setLoadingProgress(0);

        // Fetch the user's inventory
        const userDocRef = doc(firestore, "users", userDocId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setInventory(userDocSnap.data().inventory || []);
        }
        setLoadingProgress(20); // 20% progress after fetching inventory

        // Get total number of cards first
        const cardsSnapshot = await getDocs(collection(firestore, "cards"));
        const totalCardCount = cardsSnapshot.size;
        setTotalCards(totalCardCount);

        // Fetch all cards from the cards collection
        const cardsData = [];
        let processedCards = 0;

        for (let card of cardsSnapshot.docs) {
          const cardData = card.data();

          // Ensure the card has a 'cardName' property
          if (!cardData.cardName) {
            console.warn(
              `Card with ID ${card.id} is missing a 'cardName' property.`
            );
            cardData.cardName = "Unknown Card";
          }

          // Get the image URL from Firebase Storage
          const imageRef = storageRef(storage, cardData.imageUrl);
          cardData.imageUrl = await getDownloadURL(imageRef);
          cardData.id = card.id;
          cardsData.push(cardData);

          processedCards++;
          setLoadedCards(processedCards);
          // Calculate progress (20-100%, since first 20% was for inventory)
          const cardProgress = (processedCards / totalCardCount) * 80;
          setLoadingProgress(20 + cardProgress);
        }

        // Sort all cards alphabetically by cardName
        cardsData.sort((a, b) => a.cardName.localeCompare(b.cardName));

        // Set the allCards state with the fetched cards
        setAllCards(cardsData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setIsLoading(false);
      }
    };

    fetchInventoryAndCards();
  }, [userDocId]);

  // Filter the cards based on the search query and other dropdown filters
  const filteredCards = allCards.filter((card) => {
    const matchesSearchQuery = card.cardName
      .toLowerCase()
      .startsWith(searchQuery.toLowerCase());
    const matchesCardType = cardType ? card.cardType === cardType : true;
    const matchesCardAttribute = cardAttribute
      ? card.cardAttribute === cardAttribute
      : true;
    const matchesCardClass = cardClass ? card.cardClass === cardClass : true;
    const matchesCardCharacter = cardCharacter
      ? card.cardCharacter === cardCharacter
      : true;
    const matchesCardLevel = cardLevel
      ? card.cardLevel === Number(cardLevel)
      : true;

    return (
      matchesSearchQuery &&
      matchesCardType &&
      matchesCardAttribute &&
      matchesCardClass &&
      matchesCardCharacter &&
      matchesCardLevel
    );
  });

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
      id="dictionary"
      style={{ backgroundImage: `url(${dictionaryBg})` }}
      className="sm:px-12 lg:px-24"
    >
      <Link to={`/${userDocId}/home`} className="back-button">
        <i className="fas fa-reply back-icon"></i>
      </Link>

      <div className="overlay"></div>

      {isLoading ? (
        <div className="wrapper sm:pt-4 lg:pt-12 text-white flex flex-col items-center justify-center min-h-[50vh]">
          <div className="text-2xl mb-4">Loading Cards...</div>
          <div className="w-64 bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <div className="text-lg">
            Fetched {loadedCards} out of {totalCards} cards
          </div>
        </div>
      ) : (
        <div className="wrapper sm:pt-4 lg:pt-12 text-white">
          <div className="cards">
            <div className="mb-4 flex justify-between">
              <h1 className="sm:text-4xl lg:text-6xl ms-10 lg:ms-0">Dictionary</h1>

              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={handleSearch}
                class="px-4 sm:me-5 lg:me-12 bg-transparent border-2 rounded-xl outline-none"
              ></input>
            </div>

            <div className="flex flex-wrap justify-between sm:me-5 lg:me-12 mb-4 sm:text-xs lg:text-lg">
              {/* Dropdown for Card Type */}
              <select
                value={cardType}
                onChange={(e) => {
                  setCardType(e.target.value);
                  setCardAttribute("");
                  setCardClass("");
                  setCardCharacter("");
                  setCardLevel("");
                }}
                className="p-2 xl:px-4 bg-transparent border-2 rounded-xl outline-none"
              >
                <option value="">Card Type</option>
                <option value="monster">Monster</option>
                <option value="trap">Trap</option>
                <option value="spell">Spell</option>
              </select>

              {/* Conditional Dropdowns for "Monster" card type */}
              {cardType === "monster" && (
                <>
                  <select
                    value={cardAttribute}
                    onChange={(e) => setCardAttribute(e.target.value)}
                    className="p-2 xl:px-4 bg-transparent border-2 rounded-xl outline-none"
                  >
                    <option value="">Attribute</option>
                    <option value="fire">Fire</option>
                    <option value="water">Water</option>
                    <option value="wind">Wind</option>
                    <option value="earth">Earth</option>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="divine">Divine</option>
                  </select>

                  <select
                    value={cardClass}
                    onChange={(e) => setCardClass(e.target.value)}
                    className="p-2 xl:px-4 bg-transparent border-2 rounded-xl outline-none"
                  >
                    <option value="">Class</option>
                    <option value="warrior">Warrior</option>
                    <option value="beast">Beast</option>
                    <option value="fairy">Fairy</option>
                    <option value="spellcaster">Spellcaster</option>
                    <option value="serpent">Serpent</option>
                    <option value="dragon">Dragon</option>
                    <option value="rock">Rock</option>
                    <option value="machine">Machine</option>
                  </select>

                  <select
                    value={cardCharacter}
                    onChange={(e) => setCardCharacter(e.target.value)}
                    className="p-2 xl:px-4 bg-transparent border-2 rounded-xl outline-none"
                  >
                    <option value="">Character</option>
                    <option value="normal">Normal</option>
                    <option value="effect">Effect</option>
                    <option value="fusion">Fusion</option>
                    <option value="ritual">Ritual</option>
                  </select>

                  <select
                    type="number"
                    value={cardLevel}
                    onChange={(e) => setCardLevel(e.target.value)}
                    className="p-2 xl:px-4 bg-transparent border-2 rounded-xl outline-none"
                  >
                    <option value="">Select Level</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div className="collection pb-4">
              {filteredCards
                .filter((card) => inventory.includes(card.id))
                .map((card) => (
                  <img
                    className="card"
                    src={card.imageUrl}
                    alt={card.cardName || "Card Image"}
                    onClick={() => handleCardClick(card)}
                  />
                ))}

              {filteredCards
                .filter((card) => !inventory.includes(card.id))
                .map((card) => (
                  <img
                    className={`card ${
                      inventory.includes(card.id) ? "" : "black-and-white"
                    }`}
                    src={card.imageUrl}
                    alt={card.cardName}
                    onClick={() => handleCardClick(card)}
                  />
                ))}
            </div>
          </div>

          <div className="lastCard sm:ms-2 lg:ms-4">
            {/* Display the selected card if there is one, otherwise show the placeholder */}
            {selectedCard ? (
              <>
                <img
                  className={`mx-auto w-4/5 sm:my-2 lg:my-4 ${
                    !inventory.includes(selectedCard.id) ? "black-and-white" : ""
                  }`}
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
      )}
    </main>
  );
}

export default DictionaryPage;
