"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@cards-of-power/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


export default function Workshop() {

  interface CardFormData {
    name: string;
    type: string;
    description: string;
    storageId?: string;
    atkPts?: number;
    defPts?: number;
    inGameAtkPts?: number;
    inGameDefPts?: number;
    attribute: string;
    class: string;
    character: string;
    level?: number;
    imageFile: File | null;
  }

  const [formData, setFormData] = useState<CardFormData>({
    name: "",
    type: "",
    description: "",
    atkPts: 0,
    defPts: 0,
    inGameAtkPts: 0,
    inGameDefPts: 0,
    attribute: "",
    class: "",
    character: "",
    level: 1,
    imageFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // V2: create template and optionally grant to creator
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createTemplate = useMutation(api.cards.createTemplateV2);

  const validateForm = () => {
    const {
      name,
      description,
      type,
      atkPts,
      defPts,
      level,
      imageFile,
    } = formData;

    if (!name || !description || !type || !imageFile) {
      return "All fields are required.";
    }

    if (type === "monster") {
      if (
        atkPts === undefined ||
        defPts === undefined ||
        level === undefined ||
        !formData.attribute || 
        !formData.character || 
        !formData.class
      ) {
        return "All monster-specific fields are required.";
      }
      if (atkPts > 5000 || atkPts < 0 || defPts > 5000 || defPts < 0) {
        return "ATK and DEF points must not exceed 5000 or be less than 0.";
      }
      if (level > 10 || level < 0) {
        return "Card Level must not exceed 10 or be less than 0.";
      }
    }

    // Runtime assertion: imageFile must be a File object
    if (imageFile && !(imageFile instanceof File)) {
      return "Invalid image file.";
    }

    // Defensive: name and description should be strings
    if (typeof name !== "string" || typeof description !== "string") {
      return "Name and description must be text.";
    }

    return "";
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name, value } = target;
    const numericNames = [
      "atkPts",
      "defPts",
      "level",
      "inGameAtkPts",
      "inGameDefPts",
    ] as const;
    const parsedValue = (numericNames as readonly string[]).includes(name) ? Number(value) : value;
    setFormData({ ...formData, [name]: parsedValue as unknown as string & number });
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
      let storageId = "";
      
      // Upload image to Convex storage if provided
      if (formData.imageFile) {
        const uploadUrl = await generateUploadUrl();
        
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": formData.imageFile.type },
          body: formData.imageFile,
        });
        
        if (!uploadResult.ok) {
          throw new Error(`Upload failed: ${uploadResult.status} ${uploadResult.statusText}`);
        }
        
        const uploadResponse = await uploadResult.json();
        storageId = uploadResponse.storageId;
        if (!storageId || typeof storageId !== "string") {
          throw new Error("Upload did not return a storageId.");
        }
      }

      const created = await createTemplate({
        storageId,
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        atkPts: formData.type === "monster" ? Number(formData.atkPts) : undefined,
        defPts: formData.type === "monster" ? Number(formData.defPts) : undefined,
        attribute: formData.attribute || undefined,
        class: formData.class || undefined,
        character: formData.character || undefined,
        level: formData.type === "monster" ? Number(formData.level) : undefined,
        grantToCreator: true,
      });

      if (!created?.templateId) throw new Error("Card creation failed");
      toast.success("Card created successfully and added to your inventory!");
      
      // Reset form after successful creation
      setFormData({
        name: "",
        description: "",
        type: "",
        atkPts: 0,
        defPts: 0,
        inGameAtkPts: 0,
        inGameDefPts: 0,
        level: 1,
        attribute: "",
        character: "",
        class: "",
        imageFile: null,
      });
    } catch (error) {
      console.error("Failed to create card: ", error);
      setError(`Failed to create card: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          className="bg-black/60 text-white border-white/40 hover:bg-black/80 transition-colors"
        >
          ← Back to Home
        </Button>
      </Link>

      <div className="relative w-full max-w-4xl z-10">
        <div className="bg-[rgba(125,75,26,0.85)] backdrop-blur-m rounded-lg p-6 lg:p-8 shadow-2xl border border-[rgba(69,26,3,0.3)]">
          <h1 className="text-2xl lg:text-5xl mb-2 lg:mb-4 font-[var(--font-pirata-one)] text-black text-center">
            Pirate Card Submission
          </h1>

          <p className="text-sm lg:text-xl mb-4 lg:mb-6 font-[var(--font-pirata-one)] text-black text-center">
            Ahoy Devs, I be sendin' ye a card o' great importance, a true treasure
            crafted with care and ready to sail the seas! Arrr, this ain't no
            ordinary card—it's one that holds the power to make waves, and I trust
            ye'll handle it with the utmost skill. Below, ye'll find all the
            details ye need to bring this mighty card to life and ensure its place
            among the greatest treasures.
          </p>
          <form
            onSubmit={handleSubmit}
            className="flex gap-6 text-xs lg:text-base font-[var(--font-pirata-one)]"
          >
          {/* LEFT SIDE */}
          <div className="w-1/2 space-y-4 lg:space-y-6">
            <div>
              <label className="block text-black font-[var(--font-pirata-one)]">Card Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter card name"
                className="w-full bg-transparent border-b-2 border-black outline-none text-black font-[var(--font-pirata-one)] placeholder:text-black/70"
              />
            </div>

            <div>
              <label className="block text-black font-[var(--font-pirata-one)]">Card Description:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter description"
                className="w-full bg-transparent border-b-2 border-black outline-none resize-none text-black font-[var(--font-pirata-one)] placeholder:text-black/70"
              />
            </div>

            <div>
              <label className="block text-black font-[var(--font-pirata-one)]">Card Type:</label>
              <select
                name="type"
                value={formData.type}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    type: value,
                    attribute: "",
                    class: "",
                    character: "",
                    level: 0,
                    atkPts: 0,
                    defPts: 0,
                  });
                }}
                className="w-full bg-transparent border-b-2 border-black outline-none text-black font-[var(--font-pirata-one)]"
              >
                <option value=""></option>
                <option value="monster">Monster</option>
                <option value="spell">Spell</option>
                <option value="trap">Trap</option>
              </select>
            </div>

            <div>
              <label className="block text-black font-[var(--font-pirata-one)]">Image File:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full border-none bg-transparent outline-none text-black font-[var(--font-pirata-one)]"
              />
            </div>

            {error && <p className="text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white bg-[rgb(69,26,3)] font-[var(--font-pirata-one)] text-lg hover:bg-[rgb(89,36,13)] transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Card"}
            </button>
          </div>

          {/* RIGHT SIDE (only for monster) */}
          {formData.type === "monster" && (
            <div className="w-1/2 space-y-4 lg:space-y-6">
              <div>
                <label className="block text-black font-[var(--font-pirata-one)]">Attack Points:</label>
                <input
                  type="number"
                  name="atkPts"
                  value={formData.atkPts}
                  onChange={handleInputChange}
                  max="5000"
                  placeholder="0 - 5000"
                  className="w-full bg-transparent border-b-2 border-black outline-none text-black font-[var(--font-pirata-one)] placeholder:text-black/70"
                />
              </div>

              <div>
                <label className="block text-black font-[var(--font-pirata-one)]">Defense Points:</label>
                <input
                  type="number"
                  name="defPts"
                  value={formData.defPts}
                  onChange={handleInputChange}
                  max="5000"
                  placeholder="0 - 5000"
                  className="w-full bg-transparent border-b-2 border-black outline-none text-black font-[var(--font-pirata-one)] placeholder:text-black/70"
                />
              </div>

              <div>
                <label className="block text-black font-[var(--font-pirata-one)]">Card Level:</label>
                <input
                  type="number"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  max="10"
                  placeholder="0 - 10"
                  className="w-full bg-transparent border-b-2 border-black outline-none text-black font-[var(--font-pirata-one)] placeholder:text-black/70"
                />
              </div>

              <div>
                <label className="block text-black font-[var(--font-pirata-one)]">Attribute:</label>
                <select
                  name="attribute"
                  value={formData.attribute}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-b-2 border-black outline-none text-black font-[var(--font-pirata-one)]"
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
                <label className="block text-black font-[var(--font-pirata-one)]">Character:</label>
                <select
                  name="character"
                  value={formData.character}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-b-2 border-black outline-none text-black font-[var(--font-pirata-one)]"
                >
                  <option value=""></option>
                  <option value="normal">Normal</option>
                  <option value="effect">Effect</option>
                  <option value="fusion">Fusion</option>
                  <option value="ritual">Ritual</option>
                </select>
              </div>

              <div>
                <label className="block text-black font-[var(--font-pirata-one)]">Class:</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border-b-2 border-black outline-none text-black font-[var(--font-pirata-one)]"
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
    </div>
  );
}
