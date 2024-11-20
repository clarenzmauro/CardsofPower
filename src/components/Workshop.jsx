import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { firestore, storage } from "./firebaseConfig";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, doc, getDoc } from 'firebase/firestore';

function Workshop() {
  const { userDocId } = useParams();
  const [formData, setFormData] = useState({
    cardName: '',
    cardDesc: '',
    cardType: '',
    atkPts: '',
    defPts: '',
    cardLevel: '',
    cardAttribute: '',
    cardCharacter: '',
    cardClass: '',
    imageFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      return 'All fields are required.';
    }

    if (cardType === 'monster') {
      if (
        !atkPts ||
        !defPts ||
        !cardLevel ||
        !cardAttribute ||
        !cardCharacter ||
        !cardClass
      ) {
        return 'All monster-specific fields are required.';
      }
      if (atkPts > 5000 || defPts > 5000) {
        return 'ATK and DEF points must not exceed 5000.';
      }
      if (cardLevel > 10) {
        return 'Card Level must not exceed 10.';
      }
    }

    return '';
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
    setError('');
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
      const userDoc = await getDoc(doc(db, 'users', userDocId));
      const creatorName = userDoc.exists() ? userDoc.data().username : '';

      // Prepare data for Firestore
      const cardData = {
        cardName: formData.cardName,
        cardDesc: formData.cardDesc,
        cardType: formData.cardType,
        imageUrl,
        atkPts: formData.cardType === 'monster' ? Number(formData.atkPts) : 0,
        defPts: formData.cardType === 'monster' ? Number(formData.defPts) : 0,
        cardLevel: formData.cardType === 'monster' ? Number(formData.cardLevel) : 0,
        cardAttribute: formData.cardType === 'monster' ? formData.cardAttribute : '',
        cardCharacter: formData.cardType === 'monster' ? formData.cardCharacter : '',
        cardClass: formData.cardType === 'monster' ? formData.cardClass : '',
        boughtFor: 0,
        cardLose: { local: 0, global: 0 },
        cardMatch: { local: 0, global: 0 },
        cardWin: { local: 0, global: 0 },
        currentOwnerId: '',
        currentOwnerUsername: '',
        inGameAtkPts: formData.cardType === 'monster' ? Number(formData.atkPts) : 0,
        inGameDefPts: formData.cardType === 'monster' ? Number(formData.defPts) : 0,
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
      await addDoc(collection(db, 'workshop'), cardData);
      alert('Card successfully created!');
      setFormData({
        cardName: '',
        cardDesc: '',
        cardType: '',
        atkPts: '',
        defPts: '',
        cardLevel: '',
        cardAttribute: '',
        cardCharacter: '',
        cardClass: '',
        imageFile: null,
      });
    } catch (err) {
      console.error(err);
      setError('An error occurred while creating the card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workshop">
      <h1>Create Your Card</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="cardName"
          placeholder="Card Name"
          value={formData.cardName}
          onChange={handleInputChange}
        />
        <textarea
          name="cardDesc"
          placeholder="Card Description"
          value={formData.cardDesc}
          onChange={handleInputChange}
        ></textarea>
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
          <option value="">Select Card Type</option>
          <option value="monster">Monster</option>
          <option value="spell">Spell</option>
          <option value="trap">Trap</option>
        </select>

        {formData.cardType === 'monster' && (
          <>
            <input
              type="number"
              name="atkPts"
              placeholder="Attack Points"
              value={formData.atkPts}
              onChange={handleInputChange}
              max="5000"
            />
            <input
              type="number"
              name="defPts"
              placeholder="Defense Points"
              value={formData.defPts}
              onChange={handleInputChange}
              max="5000"
            />
            <input
              type="number"
              name="cardLevel"
              placeholder="Card Level"
              value={formData.cardLevel}
              onChange={handleInputChange}
              max="10"
            />
            <select
              name="cardAttribute"
              value={formData.cardAttribute}
              onChange={handleInputChange}
            >
              <option value="">Select Attribute</option>
              <option value="fire">Fire</option>
              <option value="water">Water</option>
              <option value="wind">Wind</option>
              <option value="earth">Earth</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="divine">Divine</option>
            </select>
            <select
              name="cardCharacter"
              value={formData.cardCharacter}
              onChange={handleInputChange}
            >
              <option value="">Select Character</option>
              <option value="normal">Normal</option>
              <option value="effect">Effect</option>
              <option value="fusion">Fusion</option>
              <option value="ritual">Ritual</option>
            </select>
            <select
              name="cardClass"
              value={formData.cardClass}
              onChange={handleInputChange}
            >
              <option value="">Select Class</option>
              <option value="warrior">Warrior</option>
              <option value="beast">Beast</option>
              <option value="fairy">Fairy</option>
              <option value="spellcaster">Spellcaster</option>
              <option value="serpent">Serpent</option>
              <option value="dragon">Dragon</option>
              <option value="rock">Rock</option>
              <option value="machine">Machine</option>
            </select>
          </>
        )}

        <input type="file" onChange={handleFileChange} />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Card'}
        </button>
      </form>
    </div>
  );
}

export default Workshop;
