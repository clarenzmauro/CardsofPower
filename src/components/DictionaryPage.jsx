import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { firestore, storage } from "./firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import './InventoryPage.css';

function DictionaryPage() {
  const { userDocId } = useParams();
  const [allCards, setAllCards] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(false); // For the "Owned" checkbox filter
  const [cardType, setCardType] = useState(""); // For "Card Type" dropdown
  const [cardAttribute, setCardAttribute] = useState(""); // For "Card Attribute" dropdown
  const [cardClass, setCardClass] = useState(""); // For "Card Class" dropdown
  const [cardCharacter, setCardCharacter] = useState(""); // For "Card Character" dropdown
  const [cardLevel, setCardLevel] = useState(""); // For "Card Level" number input

  useEffect(() => {
    const fetchInventoryAndCards = async () => {
      try {
        // Fetch the user's inventory
        const userDocRef = doc(firestore, "users", userDocId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setInventory(userDocSnap.data().inventory || []);
        }

        // Fetch all cards from the cards collection
        const cardsSnapshot = await getDocs(collection(firestore, "cards"));
        const cardsData = [];
        for (let card of cardsSnapshot.docs) {
          const cardData = card.data();

          // Ensure the card has a 'cardName' property
          if (!cardData.cardName) {
            console.warn(`Card with ID ${card.id} is missing a 'cardName' property.`);
            cardData.cardName = "Unknown Card"; // Provide a default value
          }

          // Get the image URL from Firebase Storage
          const imageRef = storageRef(storage, cardData.imageUrl);
          cardData.imageUrl = await getDownloadURL(imageRef);
          cardData.id = card.id; // Store card ID for comparison
          cardsData.push(cardData);
        }

        // Sort all cards alphabetically by cardName
        cardsData.sort((a, b) => a.cardName.localeCompare(b.cardName));

        // Set the allCards state with the fetched cards
        setAllCards(cardsData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchInventoryAndCards();
  }, [userDocId]);

  // Filter the cards based on the search query and other dropdown filters
  const filteredCards = allCards.filter(card => {
    const matchesSearchQuery = card.cardName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCardType = cardType ? card.cardType === cardType : true;
    const matchesCardAttribute = cardAttribute ? card.cardAttribute === cardAttribute : true;
    const matchesCardClass = cardClass ? card.cardClass === cardClass : true;
    const matchesCardCharacter = cardCharacter ? card.cardCharacter === cardCharacter : true;
    const matchesCardLevel = cardLevel ? card.cardLevel === Number(cardLevel) : true;
    const matchesOwnership = ownedOnly ? inventory.includes(card.id) : true;

    return matchesSearchQuery && matchesCardType && matchesCardAttribute && matchesCardClass && 
           matchesCardCharacter && matchesCardLevel && matchesOwnership;
  });

  return (
    <div>
      <h1>Dictionary</h1>
      
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} // Update search query on change
        />
      </div>

      {/* Checkbox for "Owned Only" filter */}
      <div className="filter-checkbox">
        <input
          type="checkbox"
          checked={ownedOnly}
          onChange={() => setOwnedOnly(prev => !prev)}
        />
        <label>Owned</label>
      </div>

      {/* Dropdown for Card Type */}
      <div className="filter-dropdown">
        <label>Card Type</label>
        <select value={cardType} onChange={(e) => setCardType(e.target.value)}>
          <option value="">Select Card Type</option>
          <option value="monster">Monster</option>
          <option value="trap">Trap</option>
          <option value="spell">Spell</option>
        </select>
      </div>

      {/* Conditional Dropdowns for "Monster" card type */}
      {cardType === "monster" && (
        <>
          <div className="filter-dropdown">
            <label>Card Attribute</label>
            <select value={cardAttribute} onChange={(e) => setCardAttribute(e.target.value)}>
              <option value="">Select Card Attribute</option>
              <option value="fire">Fire</option>
              <option value="water">Water</option>
              <option value="wind">Wind</option>
              <option value="earth">Earth</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="divine">Divine</option>
            </select>
          </div>

          <div className="filter-dropdown">
            <label>Card Class</label>
            <select value={cardClass} onChange={(e) => setCardClass(e.target.value)}>
              <option value="">Select Card Class</option>
              <option value="warrior">warrior</option>
              <option value="beast">beast</option>
              <option value="fairy">fairy</option>
              <option value="spellcaster">spellcaster</option>
              <option value="serpent">serpent</option>
              <option value="dragon">dragon</option>
              <option value="rock">rock</option>
              <option value="machine">machine</option>
            </select>
          </div>

          <div className="filter-dropdown">
            <label>Card Character</label>
            <select value={cardCharacter} onChange={(e) => setCardCharacter(e.target.value)}>
              <option value="">Select Card Character</option>
              <option value="normal">normal</option>
              <option value="effect">effect</option>
              <option value="fusion">fusion</option>
              <option value="ritual">ritual</option>
            </select>
          </div>

          <div className="filter-dropdown">
            <label>Card Level</label>
            <input
              type="number"
              value={cardLevel}
              onChange={(e) => setCardLevel(e.target.value)}
              placeholder="Enter card level"
            />
          </div>
        </>
      )}

      <div className="cards-container">
        {/* Display owned cards first */}
        {filteredCards.filter(card => inventory.includes(card.id)).map((card) => (
          <div key={card.id} className="card">
            <img src={card.imageUrl} alt={card.cardName} />
            <p>{card.cardName}</p>
          </div>
        ))}

        {/* Display non-owned cards next */}
        {filteredCards.filter(card => !inventory.includes(card.id)).map((card) => (
          <div key={card.id} className={`card ${inventory.includes(card.id) ? "" : "black-and-white"}`}>
            <img src={card.imageUrl} alt={card.cardName} />
            <p>{card.cardName}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DictionaryPage;
 