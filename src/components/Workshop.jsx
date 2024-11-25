import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import workshopBg from "../assets/backgrounds/workshop.png";
import "./Workshop.css";

function Workshop() {
  const { userDocId } = useParams();
  const [formData, setFormData] = useState({
    cardName: "",
    cardDesc: "",
    cardType: "",
    atkPts: "",
    defPts: "",
    cardLevel: "",
    cardAttribute: "",
    cardCharacter: "",
    cardClass: "",
    imageFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const db = getFirestore();
  const storage = getStorage();

  const validateForm = () => {
    const {
      cardName,
      cardDesc,
      cardType,
      atkPts,
      defPts,
      cardLevel,
      cardAttribute,
      cardCharacter,
      cardClass,
    } = formData;

    if (!cardName || !cardDesc || !cardType || !formData.imageFile) {
      return "All fields are required.";
    }

    if (cardType === "monster") {
      if (
        !atkPts ||
        !defPts ||
        !cardLevel ||
        !cardAttribute ||
        !cardCharacter ||
        !cardClass
      ) {
        return "All monster-specific fields are required.";
      }
      if (atkPts > 5000 || atkPts < 0 || defPts > 5000 || defPts < 0) {
        return "ATK and DEF points must not exceed 5000 or be less than 0.";
      }
      if (cardLevel > 10 || cardLevel < 0) {
        return "Card Level must not exceed 10 or be less than 0.";
      }
    }

    return "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, imageFile: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Upload image to Firebase Storage
      const imageRef = ref(storage, `workshop/${formData.imageFile.name}`);
      await uploadBytes(imageRef, formData.imageFile);
      const imageUrl = await getDownloadURL(imageRef);

      // Retrieve creatorName from Firestore
      const userDoc = await getDoc(doc(db, "users", userDocId));
      const creatorName = userDoc.exists() ? userDoc.data().username : "";

      // Prepare data for Firestore
      const cardData = {
        cardName: formData.cardName,
        cardDesc: formData.cardDesc,
        cardType: formData.cardType,
        imageUrl,
        atkPts: formData.cardType === "monster" ? Number(formData.atkPts) : 0,
        defPts: formData.cardType === "monster" ? Number(formData.defPts) : 0,
        cardLevel:
          formData.cardType === "monster" ? Number(formData.cardLevel) : 0,
        cardAttribute:
          formData.cardType === "monster" ? formData.cardAttribute : "",
        cardCharacter:
          formData.cardType === "monster" ? formData.cardCharacter : "",
        cardClass: formData.cardType === "monster" ? formData.cardClass : "",
        boughtFor: 0,
        cardLose: { local: 0, global: 0 },
        cardMatch: { local: 0, global: 0 },
        cardWin: { local: 0, global: 0 },
        currentOwnerId: "",
        currentOwnerUsername: "",
        inGameAtkPts:
          formData.cardType === "monster" ? Number(formData.atkPts) : 0,
        inGameDefPts:
          formData.cardType === "monster" ? Number(formData.defPts) : 0,
        isListed: false,
        isOwned: false,
        marketCount: 0,
        marketValue: 0,
        passCount: 0,
        roi: 0,
        creatorId: userDocId,
        creatorName,
      };

      // Save to Firestore
      await addDoc(collection(db, "workshop"), cardData);

      if (userDoc.exists) {
        const userDocRef = doc(db, "users", userDocId);
        const currentCardCreated = userDoc.data().cardsCreated || 0;
        await updateDoc(userDocRef, {
          cardsCreated: currentCardCreated + 1,
        });
      }

      alert("Card successfully created!");
      setFormData({
        cardName: "",
        cardDesc: "",
        cardType: "",
        atkPts: "",
        defPts: "",
        cardLevel: "",
        cardAttribute: "",
        cardCharacter: "",
        cardClass: "",
        imageFile: null,
      });
    } catch (err) {
      console.error(err);
      setError("An error occurred while creating the card.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="workshop"
      style={{ backgroundImage: `url(${workshopBg})` }}
      className="flex justify-center items-center"
    >
      <Link to={`/${userDocId}/home`} className="back-button">
        <i className="fas fa-reply back-icon"></i>
      </Link>

      <div className="w-1/2">
        <h1 className="sm:text-lg lg:text-5xl sm:mb-2 lg:mb-4">
          Pirate Card Submission
        </h1>

        <p className="sm:text-xs lg:text-xl sm:mb-4 lg:mb-6">
          &nbsp;&nbsp;&nbsp;&nbsp;Ahoy Devs, I be sendin' ye a card o' great
          importance, a true treasure crafted with care and ready to sail the
          seas! Arrr, this ain't no ordinary card—it's one that holds the power
          to make waves, and I trust ye&apos;ll handle it with the utmost skill.
          Below, ye&apos;ll find all the details ye need to bring this mighty
          card to life and ensure its place among the greatest treasures.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex gap-6 sm:text-xs lg:text-base"
        >
          <div className="w-1/2">
            <div>
              <label>Card Name:</label>
              <input
                type="text"
                name="cardName"
                value={formData.cardName}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label>Card Description:</label>
              <br />
              <textarea
                name="cardDesc"
                value={formData.cardDesc}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <div>
              <label>Card Type:</label>
              <select
                name="cardType"
                value={formData.cardType}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    cardType: value,
                    cardAttribute: "",
                    cardClass: "",
                    cardCharacter: "",
                    cardLevel: "",
                    atkPts: "",
                    defPts: "",
                  });
                }}
              >
                <option value=""></option>
                <option value="monster">Monster</option>
                <option value="spell">Spell</option>
                <option value="trap">Trap</option>
              </select>
            </div>

            <div>
              <label>Image File:</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="imgFile"
              />
            </div>

            {error && <p className="text-red-600">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Card"}
            </button>
          </div>

          {formData.cardType === "monster" && (
            <div className="w-1/2">
              <div>
                <label>Attack Points:</label>
                <input
                  type="number"
                  name="atkPts"
                  value={formData.atkPts}
                  onChange={handleInputChange}
                  max="5000"
                />
              </div>

              <div>
                <label>Defense Points:</label>
                <input
                  type="number"
                  name="defPts"
                  value={formData.defPts}
                  onChange={handleInputChange}
                  max="5000"
                />
              </div>

              <div>
                <label>Card Level:</label>
                <input
                  type="number"
                  name="cardLevel"
                  value={formData.cardLevel}
                  onChange={handleInputChange}
                  max="10"
                />
              </div>

              <div>
                <label>Attribute:</label>
                <select
                  name="cardAttribute"
                  value={formData.cardAttribute}
                  onChange={handleInputChange}
                >
                  <option value=""></option>
                  <option value="fire">Fire</option>
                  <option value="water">Water</option>
                  <option value="wind">Wind</option>
                  <option value="earth">Earth</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="divine">Divine</option>
                </select>
              </div>

              <div>
                <label>Character:</label>
                <select
                  name="cardCharacter"
                  value={formData.cardCharacter}
                  onChange={handleInputChange}
                >
                  <option value=""></option>
                  <option value="normal">Normal</option>
                  <option value="effect">Effect</option>
                  <option value="fusion">Fusion</option>
                  <option value="ritual">Ritual</option>
                </select>
              </div>

              <div>
                <label>Class:</label>
                <select
                  name="cardClass"
                  value={formData.cardClass}
                  onChange={handleInputChange}
                >
                  <option value=""></option>
                  <option value="warrior">Warrior</option>
                  <option value="beast">Beast</option>
                  <option value="fairy">Fairy</option>
                  <option value="spellcaster">Spellcaster</option>
                  <option value="serpent">Serpent</option>
                  <option value="dragon">Dragon</option>
                  <option value="rock">Rock</option>
                  <option value="machine">Machine</option>
                </select>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Workshop;
