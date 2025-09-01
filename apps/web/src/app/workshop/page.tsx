"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@cards-of-power/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function Workshop() {
  const { userDocId } = useParams<{ userDocId: string }>();

  interface CardFormData {
    cardName: string;
    cardDesc: string;
    cardType: string;
    atkPts: number | string;
    defPts: number | string;
    cardLevel: number | string;
    cardAttribute: string;
    cardCharacter: string;
    cardClass: string;
    imageFile: File | null;
  }

  const [formData, setFormData] = useState<CardFormData>({
    cardName: "",
    cardDesc: "",
    cardType: "",
    atkPts: 0,
    defPts: 0,
    cardLevel: 0,
    cardAttribute: "",
    cardCharacter: "",
    cardClass: "",
    imageFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createCard = useMutation(api.cards.addCompleteCard);

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
      const atkNum = Number(atkPts);
      const defNum = Number(defPts);
      const levelNum = Number(cardLevel);

      if (
        !atkNum ||
        !defNum ||
        !levelNum ||
        !cardAttribute ||
        !cardCharacter ||
        !cardClass
      ) {
        return "All monster-specific fields are required.";
      }
      if (atkNum > 5000 || atkNum < 0 || defNum > 5000 || defNum < 0) {
        return "ATK and DEF points must not exceed 5000 or be less than 0.";
      }
      if (levelNum > 10 || levelNum < 0) {
        return "Card Level must not exceed 10 or be less than 0.";
      }
    }
    return "";
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const imageUrl = formData.imageFile
        ? URL.createObjectURL(formData.imageFile)
        : "/assets/cards/blank.png";

      await createCard({
        // Basic Info
        name: formData.cardName,
        type: formData.cardType,
        description: formData.cardDesc,
        imageUrl: imageUrl,

        // Monster Stats
        atkPts:
          formData.cardType === "monster" ? Number(formData.atkPts) : undefined,
        defPts:
          formData.cardType === "monster" ? Number(formData.defPts) : undefined,

        // Monster Properties
        attribute: formData.cardAttribute || undefined,
        class: formData.cardClass || undefined,
        character: formData.cardCharacter || undefined,
        level:
          formData.cardType === "monster"
            ? Number(formData.cardLevel)
            : undefined,

        // Ownership & Market
        isOwned: false,
        isListed: false,
        currentOwnerId: userDocId,
        currentOwnerUsername: "",
      });

      alert("Card created successfully");
    } catch (error) {
      console.error("Failed to create card: ", error);
      alert("Failed to create card");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="workshop"
      style={{ backgroundImage: "url('/assets/backgrounds/workshop.png')" }}
      className="h-screen w-screen bg-cover bg-center flex justify-center items-center text-black"
    >
      {/* back button */}
      <Link href="/" className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className="bg-black/60 text-black border-black/40 hover:bg-black/80 transition-colors"
        >
          ← Back to Home
        </Button>
      </Link>

      <div className="relative w-full max-w-4xl z-10">
        <h1 className="text-2xl lg:text-5xl mb-2 lg:mb-4">
          Pirate Card Submission
        </h1>

        <p className="text-sm lg:text-xl mb-4 lg:mb-6">
          Ahoy Devs, I be sendin' ye a card o' great importance, a true treasure
          crafted with care and ready to sail the seas! Arrr, this ain't no
          ordinary card—it's one that holds the power to make waves, and I trust
          ye'll handle it with the utmost skill. Below, ye'll find all the
          details ye need to bring this mighty card to life and ensure its place
          among the greatest treasures.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex gap-6 text-xs lg:text-base"
        >
          {/* LEFT SIDE */}
          <div className="w-1/2 space-y-4 lg:space-y-6">
            <div>
              <label className="block">Card Name:</label>
              <input
                type="text"
                name="cardName"
                value={formData.cardName}
                onChange={handleInputChange}
                placeholder="Enter card name"
                className="w-full bg-transparent border-b-2 border-black outline-none text-black"
              />
            </div>

            <div>
              <label className="block">Card Description:</label>
              <textarea
                name="cardDesc"
                value={formData.cardDesc}
                onChange={handleInputChange}
                placeholder="Enter description"
                className="w-full bg-transparent border-b-2 border-black outline-none resize-none text-black"
              />
            </div>

            <div>
              <label className="block">Card Type:</label>
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
                    cardLevel: 0,
                    atkPts: 0,
                    defPts: 0,
                  });
                }}
                className="w-full bg-transparent border-b-2 border-black outline-none"
              >
                <option value=""></option>
                <option value="monster">Monster</option>
                <option value="spell">Spell</option>
                <option value="trap">Trap</option>
              </select>
            </div>

            <div>
              <label className="block">Image File:</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full border-none bg-transparent outline-none"
              />
            </div>

            {error && <p className="text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white bg-[rgb(69,26,3)]"
            >
              {loading ? "Creating..." : "Create Card"}
            </button>
          </div>

          {/* RIGHT SIDE (only for monster) */}
          {formData.cardType === "monster" && (
            <div className="w-1/2 space-y-4 lg:space-y-6">
              <div>
                <label className="block">Attack Points:</label>
                <input
                  type="number"
                  name="atkPts"
                  value={formData.atkPts}
                  onChange={handleInputChange}
                  max="5000"
                  placeholder="0 - 5000"
                  className="w-full bg-transparent border-b-2 border-black outline-none text-black"
                />
              </div>

              <div>
                <label className="block">Defense Points:</label>
                <input
                  type="number"
                  name="defPts"
                  value={formData.defPts}
                  onChange={handleInputChange}
                  max="5000"
                  placeholder="0 - 5000"
                  className="w-full bg-transparent border-b-2 border-black outline-none"
                />
              </div>

              <div>
                <label className="block">Card Level:</label>
                <input
                  type="number"
                  name="cardLevel"
                  value={formData.cardLevel}
                  onChange={handleInputChange}
                  max="10"
                  placeholder="0 - 10"
                  className="w-full bg-transparent border-b-2 border-black outline-none"
                />
              </div>

              <div>
                <label className="block">Attribute:</label>
                <select
                  name="cardAttribute"
                  value={formData.cardAttribute}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-b-2 border-black outline-none"
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
                <label className="block">Character:</label>
                <select
                  name="cardCharacter"
                  value={formData.cardCharacter}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-b-2 border-black outline-none"
                >
                  <option value=""></option>
                  <option value="normal">Normal</option>
                  <option value="effect">Effect</option>
                  <option value="fusion">Fusion</option>
                  <option value="ritual">Ritual</option>
                </select>
              </div>

              <div>
                <label className="block">Class:</label>
                <select
                  name="cardClass"
                  value={formData.cardClass}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-b-2 border-black outline-none"
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
