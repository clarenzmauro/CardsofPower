"use client";

// }

// Temporary placeholder component to make this a valid module
// Uncomment the code below when ready to use the upload functionality
export default function UploadPage() {
    return (
        <main className="min-h-screen bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-4">Upload Page</h1>
                <p className="text-gray-300">This page is temporarily disabled.</p>
            </div>
        </main>
    );
}

// import { useState } from "react";
// import { useMutation } from "convex/react";
// import { useRouter } from "next/navigation";
// import { api } from "@cards-of-power/backend/convex/_generated/api";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/text-area";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import { X } from "lucide-react";


// /**
//  * @description
//  * Card upload page for selecting existing card images and data
//  *
//  * @receives data from:
//  * - User: form inputs and image selection
//  * - Convex: card creation
//  *
//  * @sends data to:
//  * - Convex database: card data with selected image
//  *
//  * @sideEffects:
//  * - Creates card records in database
//  */
// // Available card images organized by category
// const cardImages = {
//     "Earth": [
//         "EarthGolem.png",
//         "HeartOfTheMountain.png",
//         "IroncladDefender.png",
//         "SteelGuardian.png",
//         "StoneSentinel.png",
//         "VineGuardian.png"
//     ],
//     "Fire": [
//         "AshenSovereign.png",
//         "BlazeKnight.png",
//         "BlazingMinotaur.png",
//         "CrimsonBladeMage.png",
//         "InfernoGiant.png",
//         "LavapulsePhoenix.png",
//         "PhoenixHatchling.png"
//     ],
//     "Water": [
//         "AbyssKraken.png",
//         "AbyssSerpent.png",
//         "AquaSerpent.png",
//         "DeepSeaLeviathan.png",
//         "FrostborneChampion.png",
//         "TidecallerOverlord.png"
//     ],
//     "Wind (No icon)": [
//         "CycloneSerpent.png",
//         "GaleStriker.png",
//         "SkyReaver.png",
//         "StormDragon.png",
//         "StormWielder.png",
//         "TempestWindBeast.png",
//         "WindFairy.png",
//         "WindScout.png"
//     ],
//     "Light": [
//         "CrystalGuardian.png",
//         "ElectricSabre.png",
//         "LightbinderPaladin.png",
//         "LunarWolf.png",
//         "MoonlightArcher.png",
//         "SolarGuardian.png",
//         "StarlightSeraph.png",
//         "ThunderColossus.png",
//         "ThunderScout.png"
//     ],
//     "Dark (No icon)": [
//         "ChaosMagus.png",
//         "DarksteelScorpion.png",
//         "DreadOfShadows.png",
//         "NecroWarrior.png",
//         "ShadowRogue.png",
//         "VenomDragon.png",
//         "VenomousViper.png"
//     ],
//     "Divine": [
//         "AethersWrath.png",
//         "BaneOfExistence.png",
//         "CelestialOutcast.png",
//         "CelestialZenith.png",
//         "ForgemasterOfCreation.png",
//         "Ixchel.png",
//         "Ra'sHerald.png"
//     ],
//     "Spell (No icon)": [
//         "AtkRecalibration.png",
//         "ChronoFreeze.png",
//         "CounterSpellMatrix.png",
//         "DimensionBreach.png",
//         "EchoPulse.png",
//         "ElementalAmplifier.png",
//         "EnergyTransfer.png",
//         "FateSwap.png",
//         "FieldCollapse.png",
//         "ForcedConstraints.png",
//         "GraveReversal.png",
//         "GravitonShift.png",
//         "ManaOvercharge.png",
//         "MemorySurge.png",
//         "MonsterRewind.png",
//         "OverloadSummon.png",
//         "QuickEvade.png",
//         "RitualOfReflection.png",
//         "ShiftingSands.png",
//         "SoulHarvest.png",
//         "SpectralArmory.png",
//         "Spellbinding.png",
//         "Spellcaster'sShield.png",
//         "SuddenStorm.png",
//         "TemporalJump.png"
//     ],
//     "Trap": [
//         "AccuratePrecision.png",
//         "AuraOfDecay.png",
//         "DefensiveCounter.png",
//         "DivineInterference.png",
//         "ElvesAmbush.png",
//         "FieldChangeAtlantis.png",
//         "FieldChangeEverNight.png",
//         "FieldChangeHellSlumber.png",
//         "FieldChangeMonolithOfLight.png",
//         "FieldChangeNezarith.png",
//         "FieldChangeZePan.png",
//         "GraveyardLock.png",
//         "GreedyEmperor.png",
//         "HailOfBlades.png",
//         "MirrorOfDestruction.png",
//         "MonsterDrain.png",
//         "PurificationLight.png",
//         "Shadow'sHand.png",
//         "SilentBarrier.png",
//         "SoulOfConfiscation.png",
//         "SpiritOfValor.png",
//         "ThroneOfVulcan.png",
//         "TrapShift.png",
//         "TreeOfWar.png",
//         "TribalChallenge.png"
//     ]
// };

// export default function UploadPage() {
//     const addCard = useMutation(api.cards.addCompleteCard);
//     const router = useRouter();
//     const [isLoading, setIsLoading] = useState(false);
//     const [selectedImage, setSelectedImage] = useState<string>("");
//     const [selectedAttribute, setSelectedAttribute] = useState<string>("");
//     const [jsonInput, setJsonInput] = useState<string>("");
//     const [showJsonInput, setShowJsonInput] = useState<boolean>(false);

//     const [formData, setFormData] = useState({
//         // Basic Info
//         name: "",
//         type: "monster",
//         description: "",
//         imageUrl: "",
        
//         // Monster Stats
//         atkPts: "",
//         defPts: "",
//         inGameAtkPts: "",
//         inGameDefPts: "",
        
//         // Monster Properties
//         attribute: "",
//         class: "",
//         character: "",
//         level: "",
        
//         // Ownership & Market
//         isOwned: false,
//         isListed: false,
//         currentOwnerId: "",
//         currentOwnerUsername: "",
//         boughtFor: "",
//         marketValue: "",
//         marketCount: "",
//         roi: "",
//         passCount: "",
        
//         // Statistics
//         matchesWins: "",
//         matchesTotal: "",
//         cardWinGlobal: "",
//         cardWinLocal: "",
//         cardLoseGlobal: "",
//         cardLoseLocal: "",
//     });



    // const handleInputChange = (field: string, value: string | boolean) => {
    //     setFormData(prev => ({
    //         ...prev,
    //         [field]: value
    //     }));
    // };

    // const handleAttributeChange = (attribute: string) => {
    //     setSelectedAttribute(attribute);
    //     setSelectedImage(""); // Reset selected image when attribute changes
    // };

    // const handleImageChange = (image: string) => {
    //     setSelectedImage(image);
    // };

    // const parseJsonData = () => {
    //     if (!jsonInput.trim()) {
    //         alert("Please enter JSON data");
    //         return;
    //     }

    //     try {
    //         const jsonData = JSON.parse(jsonInput);

    //         // Map JSON fields to form fields
    //         const mappedData = {
    //             name: jsonData.cardName || jsonData.name || "",
    //             type: jsonData.cardType || jsonData.type || "monster",
    //             description: jsonData.cardDesc || jsonData.description || "",
    //             imageUrl: jsonData.imageUrl || "",

    //             // Monster stats
    //             atkPts: jsonData.atkPts ? String(jsonData.atkPts) : "",
    //             defPts: jsonData.defPts ? String(jsonData.defPts) : "",
    //             inGameAtkPts: jsonData.inGameAtkPts ? String(jsonData.inGameAtkPts) : "",
    //             inGameDefPts: jsonData.inGameDefPts ? String(jsonData.inGameDefPts) : "",

    //             // Monster properties
    //             attribute: jsonData.cardAttribute || jsonData.attribute || "",
    //             class: jsonData.cardClass || jsonData.class || "",
    //             character: jsonData.cardCharacter || jsonData.character || "",
    //             level: jsonData.cardLevel ? String(jsonData.cardLevel) : "",

    //             // Ownership & Market
    //             isOwned: jsonData.isOwned !== undefined ? jsonData.isOwned : false,
    //             isListed: jsonData.isListed !== undefined ? jsonData.isListed : false,
    //             currentOwnerId: jsonData.currentOwnerId || "",
    //             currentOwnerUsername: jsonData.currentOwnerUsername || "",
    //             boughtFor: jsonData.boughtFor ? String(jsonData.boughtFor) : "",
    //             marketValue: jsonData.marketValue ? String(jsonData.marketValue) : "",
    //             marketCount: jsonData.marketCount ? String(jsonData.marketCount) : "",
    //             roi: jsonData.roi ? String(jsonData.roi) : "",
    //             passCount: jsonData.passCount ? String(jsonData.passCount) : "",

    //             // Statistics
    //             matchesWins: String(jsonData.cardMatch?.global || jsonData.cardWin?.global || 0),
    //             matchesTotal: String(jsonData.cardMatch?.global || jsonData.cardWin?.global || 0),
    //             cardWinGlobal: String(jsonData.cardWin?.global || 0),
    //             cardWinLocal: String(jsonData.cardWin?.local || 0),
    //             cardLoseGlobal: String(jsonData.cardLose?.global || 0),
    //             cardLoseLocal: String(jsonData.cardLose?.local || 0),
    //         };

    //         // Handle image URL and auto-detect attribute/image
    //         if (jsonData.imageUrl) {
    //             // Extract attribute and image name from URL
    //             const urlParts = jsonData.imageUrl.split('/');
    //             if (urlParts.length >= 4) {
    //                 const attribute = urlParts[urlParts.length - 2];
    //                 const imageName = urlParts[urlParts.length - 1];

    //                 // Map attribute names if needed
    //                 const attributeMapping: { [key: string]: string } = {
    //                     "Earth": "Earth",
    //                     "Fire": "Fire",
    //                     "Water": "Water",
    //                     "Wind ": "Wind (No icon)",
    //                     "Wind": "Wind (No icon)",
    //                     "Light": "Light",
    //                     "Dark ": "Dark (No icon)",
    //                     "Dark": "Dark (No icon)",
    //                     "Divine": "Divine",
    //                     "Spell ": "Spell (No icon)",
    //                     "Spell": "Spell (No icon)",
    //                     "Trap": "Trap"
    //                 };

    //                 setSelectedAttribute(attributeMapping[attribute] || attribute);
    //                 setSelectedImage(imageName);
    //             }
    //         } else if (jsonData.cardName || jsonData.name) {
    //             // Auto-detect attribute and image from card name
    //             const cardName = jsonData.cardName || jsonData.name;
    //             let foundAttribute = "";
    //             let foundImage = "";

    //             // Search through all attributes and images
    //             for (const [attribute, images] of Object.entries(cardImages)) {
    //                 const matchingImage = images.find(img => {
    //                     const imgName = img.toLowerCase().replace('.png', '').replace(/\s+/g, '');
    //                     const cardNameNormalized = cardName.toLowerCase().replace(/\s+/g, '');
    //                     return imgName === cardNameNormalized ||
    //                            imgName.includes(cardNameNormalized) ||
    //                            cardNameNormalized.includes(imgName);
    //                 });
    //                 if (matchingImage) {
    //                     foundAttribute = attribute;
    //                     foundImage = matchingImage;
    //                     break;
    //                 }
    //             }

    //             if (foundAttribute && foundImage) {
    //                 setSelectedAttribute(foundAttribute);
    //                 setSelectedImage(foundImage);
    //                 console.log(`✅ Auto-detected: ${foundAttribute} - ${foundImage} for card "${cardName}"`);
    //             } else {
    //                 console.log(`⚠️ Could not auto-detect attribute/image for card: "${cardName}"`);
    //                 console.log('Available card names:', Object.values(cardImages).flat().map(img => img.replace('.png', '')).join(', '));
    //             }
    //         }

    //         setFormData(mappedData);

    //         // Show success message with auto-detection info
    //         let successMessage = "JSON data parsed successfully!";
    //         if (selectedAttribute && selectedImage) {
    //             successMessage += `\n\nAuto-detected: ${selectedAttribute} → ${selectedImage}`;
    //         }

    //         alert(successMessage);
    //     } catch (error) {
    //         alert("Invalid JSON format. Please check your input.");
    //         console.error("JSON parsing error:", error);
    //     }
    // };

    // const toggleJsonInput = () => {
    //     setShowJsonInput(!showJsonInput);
    // };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setIsLoading(true);

//         try {
//             if (!selectedImage) {
//                 alert('Please select a card image');
//                 return;
//             }

//             // Create image URL from selected image
//             const imageUrl = `/assets/cards/${selectedAttribute}/${selectedImage}`;

//             // Create card with selected image
//             await addCard({
//                 name: formData.name,
//                 type: formData.type,
//                 description: formData.description || undefined,
//                 imageUrl,
                
//                 atkPts: formData.atkPts ? parseInt(formData.atkPts) : undefined,
//                 defPts: formData.defPts ? parseInt(formData.defPts) : undefined,
//                 inGameAtkPts: formData.inGameAtkPts ? parseInt(formData.inGameAtkPts) : undefined,
//                 inGameDefPts: formData.inGameDefPts ? parseInt(formData.inGameDefPts) : undefined,
                
//                 attribute: formData.attribute || undefined,
//                 class: formData.class || undefined,
//                 character: formData.character || undefined,
//                 level: formData.level ? parseInt(formData.level) : undefined,
                
//                 isOwned: formData.isOwned,
//                 isListed: formData.isListed,
//                 currentOwnerId: formData.currentOwnerId || undefined,
//                 currentOwnerUsername: formData.currentOwnerUsername || undefined,
//                 boughtFor: formData.boughtFor ? parseInt(formData.boughtFor) : undefined,
//                 marketValue: formData.marketValue ? parseInt(formData.marketValue) : undefined,
//                 marketCount: formData.marketCount ? parseInt(formData.marketCount) : undefined,
//                 roi: formData.roi ? parseInt(formData.roi) : undefined,
//                 passCount: formData.passCount ? parseInt(formData.passCount) : undefined,
                
//                 matches: formData.matchesTotal ? {
//                     wins: parseInt(formData.matchesWins) || 0,
//                     total: parseInt(formData.matchesTotal)
//                 } : undefined,
                
//                 cardWin: formData.cardWinGlobal ? {
//                     global: parseInt(formData.cardWinGlobal),
//                     local: parseInt(formData.cardWinLocal) || 0
//                 } : undefined,
                
//                 cardLose: formData.cardLoseGlobal ? {
//                     global: parseInt(formData.cardLoseGlobal),
//                     local: parseInt(formData.cardLoseLocal) || 0
//                 } : undefined,
//             });

//             alert("Card created successfully!");
            
//                         // Reset form
//             setFormData({
//                 name: "",
//                 type: "monster",
//                 description: "",
//                 imageUrl: "",
//                 atkPts: "",
//                 defPts: "",
//                 inGameAtkPts: "",
//                 inGameDefPts: "",
//                 attribute: "",
//                 class: "",
//                 character: "",
//                 level: "",
//                 isOwned: false,
//                 isListed: false,
//                 currentOwnerId: "",
//                 currentOwnerUsername: "",
//                 boughtFor: "",
//                 marketValue: "",
//                 marketCount: "",
//                 roi: "",
//                 passCount: "",
//                 matchesWins: "",
//                 matchesTotal: "",
//                 cardWinGlobal: "",
//                 cardWinLocal: "",
//                 cardLoseGlobal: "",
//                 cardLoseLocal: "",
//             });

//             // Reset image selection
//             setSelectedImage("");
//             setSelectedAttribute("");

//             // Reset JSON input
//             setJsonInput("");

//         } catch (error) {
//             console.error("Error creating card:", error);
//             alert("Error creating card. Please try again.");
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const removeImage = () => {
//         setSelectedImage("");
//     };



//     return (
//         <main className="min-h-screen bg-gray-900 p-8">
//             <div className="max-w-4xl mx-auto">
//                 <div className="mb-8">
//                     <h1 className="text-3xl font-bold text-white mb-2">Create Card</h1>
//                     <p className="text-gray-300">Add a new card to the database by selecting from existing images or importing JSON data</p>
//                     <Button 
//                         onClick={() => router.push("/dictionary")}
//                         className="mt-4"
//                         variant="outline"
//                     >
//                         ← Back to Dictionary
//                     </Button>
//                 </div>

//                 <form onSubmit={handleSubmit} className="space-y-6">
//                     {/* JSON Import Section */}
//                     <Card className="bg-gray-800 border-gray-700">
//                         <CardHeader>
//                             <div className="flex items-center justify-between">
//                                 <CardTitle className="text-white">Quick Import</CardTitle>
//                                 <Button
//                                     type="button"
//                                     onClick={toggleJsonInput}
//                                     variant="outline"
//                                     className="text-white border-gray-600"
//                                 >
//                                     {showJsonInput ? "Hide" : "Show"} JSON Import
//                                 </Button>
//                             </div>
//                         </CardHeader>
//                         {showJsonInput && (
//                             <CardContent className="space-y-4">
//                                 <div>
//                                     <Label htmlFor="jsonInput" className="text-white">
//                                         Paste Card Data (JSON Format)
//                                     </Label>
//                                     <Textarea
//                                         id="jsonInput"
//                                         value={jsonInput}
//                                         onChange={(e) => setJsonInput(e.target.value)}
//                                         placeholder={`Paste your card JSON data here (supports Firebase format with cardName, cardType, etc.)
// Example:
// {
//   "cardName": "Vine Guardian",
//   "cardType": "monster",
//   "cardAttribute": "earth",
//   "cardClass": "fairy",
//   "cardCharacter": "effect",
//   "atkPts": 1500,
//   "defPts": 1500,
//   "cardWin": {"global": 0, "local": 0},
//   "cardLose": {"global": 0, "local": 0},
//   "cardMatch": {"global": 0, "local": 0}
// }`}
//                                         className="bg-gray-700 text-white font-mono text-sm"
//                                         rows={12}
//                                     />
//                                 </div>
//                                 <div className="flex gap-2">
//                                     <Button
//                                         type="button"
//                                         onClick={parseJsonData}
//                                         className="bg-green-600 hover:bg-green-700"
//                                         disabled={!jsonInput.trim()}
//                                     >
//                                         Parse JSON & Fill Form
//                                     </Button>
//                                     <Button
//                                         type="button"
//                                         onClick={() => {
//                                             const sampleData = {
//                                                 "cardName": "Vine Guardian",
//                                                 "cardType": "monster",
//                                                 "cardDesc": "For every Earth monster that is defeated while this card is in the field, DEF increases by 200",
//                                                 "cardLevel": 4,
//                                                 "atkPts": 1500,
//                                                 "defPts": 1500,
//                                                 "cardAttribute": "earth",
//                                                 "cardClass": "fairy",
//                                                 "cardCharacter": "effect",
//                                                 "imageUrl": "assets/cards/Earth/VineGuardian.png",
//                                                 "inGameAtkPts": 1500,
//                                                 "inGameDefPts": 1500,
//                                                 "isOwned": true,
//                                                 "isListed": true,
//                                                 "marketValue": 1333.33,
//                                                 "boughtFor": 0,
//                                                 "marketCount": 3,
//                                                 "roi": 1333.33,
//                                                 "passCount": 1,
//                                                 "currentOwnerId": "UbiQQ3MScWLfBkMu7WzG",
//                                                 "currentOwnerUsername": "100Cards",
//                                                 "cardWin": {
//                                                     "global": 25,
//                                                     "local": 2
//                                                 },
//                                                 "cardLose": {
//                                                     "global": 10,
//                                                     "local": 0
//                                                 },
//                                                 "cardMatch": {
//                                                     "global": 50,
//                                                     "local": 2
//                                                 }
//                                             };
//                                             setJsonInput(JSON.stringify(sampleData, null, 2));
//                                         }}
//                                         variant="outline"
//                                         className="text-white border-gray-600"
//                                     >
//                                         Load Sample JSON
//                                     </Button>
//                                     <Button
//                                         type="button"
//                                         onClick={() => {
//                                             setJsonInput("");
//                                             alert("JSON input cleared");
//                                         }}
//                                         variant="outline"
//                                         className="text-white border-gray-600"
//                                     >
//                                         Clear JSON
//                                     </Button>
//                                 </div>
//                                 <div className="text-sm text-gray-400">
//                                     <p>💡 <strong>Supported formats:</strong></p>
//                                     <ul className="list-disc list-inside mt-1 space-y-1">
//                                         <li><code>cardName</code> or <code>name</code> (auto-detects image)</li>
//                                         <li><code>cardType</code> or <code>type</code></li>
//                                         <li><code>cardDesc</code> or <code>description</code></li>
//                                         <li><code>cardAttribute</code> or <code>attribute</code></li>
//                                         <li><code>cardClass</code> or <code>class</code></li>
//                                         <li><code>cardCharacter</code> or <code>character</code></li>
//                                         <li><code>cardLevel</code> or <code>level</code></li>
//                                         <li><code>imageUrl</code> (auto-detects attribute and image)</li>
//                                         <li><code>cardWin</code>, <code>cardLose</code>, <code>cardMatch</code> objects</li>
//                                         <li>All Firebase fields supported</li>
//                                     </ul>
//                                     <p className="mt-2 text-xs">🎯 <strong>Auto-detection:</strong> System automatically selects attribute and image based on card name or imageUrl</p>
//                                 </div>
//                             </CardContent>
//                         )}
//                     </Card>

//                     {/* Basic Information */}
//                     <Card className="bg-gray-800 border-gray-700">
//                         <CardHeader>
//                             <CardTitle className="text-white">Basic Information</CardTitle>
//                         </CardHeader>
//                         <CardContent className="space-y-4">
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 <div>
//                                     <Label htmlFor="name" className="text-white">Card Name</Label>
//                                     <Input
//                                         id="name"
//                                         value={formData.name}
//                                         onChange={(e) => handleInputChange("name", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                         required
//                                     />
//                                 </div>
                                
//                                 <div>
//                                     <Label htmlFor="type" className="text-white">Card Type</Label>
//                                     <Select 
//                                         value={formData.type} 
//                                         onValueChange={(value) => handleInputChange("type", value)}
//                                     >
//                                         <SelectTrigger className="bg-gray-700 text-white">
//                                             <SelectValue />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             <SelectItem value="monster">Monster</SelectItem>
//                                             <SelectItem value="spell">Spell</SelectItem>
//                                             <SelectItem value="trap">Trap</SelectItem>
//                                         </SelectContent>
//                                     </Select>
//                                 </div>
//                             </div>

//                             <div>
//                                 <Label htmlFor="description" className="text-white">Description</Label>
//                                 <Textarea
//                                     id="description"
//                                     value={formData.description}
//                                     onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("description", e.target.value)}
//                                     className="bg-gray-700 text-white"
//                                     rows={3}
//                                 />
//                             </div>

//                             {/* Image Selection Section */}
//                             <div className="space-y-4">
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                     <div>
//                                         <Label htmlFor="attribute" className="text-white">Card Attribute</Label>
//                                         <Select
//                                             value={selectedAttribute}
//                                             onValueChange={handleAttributeChange}
//                                         >
//                                             <SelectTrigger className="bg-gray-700 text-white">
//                                                 <SelectValue placeholder="Select attribute" />
//                                             </SelectTrigger>
//                                             <SelectContent>
//                                                 {Object.keys(cardImages).map((attribute) => (
//                                                     <SelectItem key={attribute} value={attribute}>
//                                                         {attribute}
//                                                     </SelectItem>
//                                                 ))}
//                                             </SelectContent>
//                                         </Select>
//                                     </div>

//                                     <div>
//                                         <Label htmlFor="image" className="text-white">Card Image</Label>
//                                         <Select
//                                             value={selectedImage}
//                                             onValueChange={handleImageChange}
//                                             disabled={!selectedAttribute}
//                                         >
//                                             <SelectTrigger className="bg-gray-700 text-white">
//                                                 <SelectValue placeholder="Select card image" />
//                                             </SelectTrigger>
//                                             <SelectContent>
//                                                 {selectedAttribute && cardImages[selectedAttribute as keyof typeof cardImages]?.map((image) => (
//                                                     <SelectItem key={image} value={image}>
//                                                         {image.replace('.png', '')}
//                                                     </SelectItem>
//                                                 ))}
//                                             </SelectContent>
//                                         </Select>
//                                     </div>
//                                 </div>

//                                 {selectedImage && selectedAttribute && (
//                                     <div className="relative">
//                                         <div className="w-32 h-40 bg-gray-700 rounded overflow-hidden mx-auto">
//                                             <img
//                                                 src={`/assets/cards/${selectedAttribute}/${selectedImage}`}
//                                                 alt="Selected card"
//                                                 className="w-full h-full object-cover"
//                                                 onError={(e) => {
//                                                     const target = e.target as HTMLImageElement;
//                                                     target.src = "/assets/cards/blank.png";
//                                                 }}
//                                             />
//                                         </div>
//                                         <Button
//                                             type="button"
//                                             onClick={removeImage}
//                                             className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 rounded-full p-1 h-8 w-8"
//                                         >
//                                             <X className="h-4 w-4" />
//                                         </Button>
//                                     </div>
//                                 )}
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Monster Stats */}
//                     {formData.type === "monster" && (
//                         <Card className="bg-gray-800 border-gray-700">
//                             <CardHeader>
//                                 <CardTitle className="text-white">Monster Stats</CardTitle>
//                             </CardHeader>
//                             <CardContent className="space-y-4">
//                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                                     <div>
//                                         <Label htmlFor="atkPts" className="text-white">ATK</Label>
//                                         <Input
//                                             id="atkPts"
//                                             type="number"
//                                             value={formData.atkPts}
//                                             onChange={(e) => handleInputChange("atkPts", e.target.value)}
//                                             className="bg-gray-700 text-white"
//                                         />
//                                     </div>
                                    
//                                     <div>
//                                         <Label htmlFor="defPts" className="text-white">DEF</Label>
//                                         <Input
//                                             id="defPts"
//                                             type="number"
//                                             value={formData.defPts}
//                                             onChange={(e) => handleInputChange("defPts", e.target.value)}
//                                             className="bg-gray-700 text-white"
//                                         />
//                                     </div>
                                    
//                                     <div>
//                                         <Label htmlFor="inGameAtkPts" className="text-white">In-Game ATK</Label>
//                                         <Input
//                                             id="inGameAtkPts"
//                                             type="number"
//                                             value={formData.inGameAtkPts}
//                                             onChange={(e) => handleInputChange("inGameAtkPts", e.target.value)}
//                                             className="bg-gray-700 text-white"
//                                         />
//                                     </div>
                                    
//                                     <div>
//                                         <Label htmlFor="inGameDefPts" className="text-white">In-Game DEF</Label>
//                                         <Input
//                                             id="inGameDefPts"
//                                             type="number"
//                                             value={formData.inGameDefPts}
//                                             onChange={(e) => handleInputChange("inGameDefPts", e.target.value)}
//                                             className="bg-gray-700 text-white"
//                                         />
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     )}

//                     {/* Monster Properties */}
//                     {formData.type === "monster" && (
//                         <Card className="bg-gray-800 border-gray-700">
//                             <CardHeader>
//                                 <CardTitle className="text-white">Monster Properties</CardTitle>
//                             </CardHeader>
//                             <CardContent className="space-y-4">
//                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                                     <div>
//                                         <Label htmlFor="attribute" className="text-white">Attribute</Label>
//                                         <Select 
//                                             value={formData.attribute} 
//                                             onValueChange={(value) => handleInputChange("attribute", value)}
//                                         >
//                                             <SelectTrigger className="bg-gray-700 text-white">
//                                                 <SelectValue placeholder="Select attribute" />
//                                             </SelectTrigger>
//                                             <SelectContent>
//                                                 <SelectItem value="fire">Fire</SelectItem>
//                                                 <SelectItem value="water">Water</SelectItem>
//                                                 <SelectItem value="wind">Wind</SelectItem>
//                                                 <SelectItem value="earth">Earth</SelectItem>
//                                                 <SelectItem value="dark">Dark</SelectItem>
//                                                 <SelectItem value="light">Light</SelectItem>
//                                                 <SelectItem value="divine">Divine</SelectItem>
//                                             </SelectContent>
//                                         </Select>
//                                     </div>
                                    
//                                     <div>
//                                         <Label htmlFor="class" className="text-white">Class</Label>
//                                         <Select 
//                                             value={formData.class} 
//                                             onValueChange={(value) => handleInputChange("class", value)}
//                                         >
//                                             <SelectTrigger className="bg-gray-700 text-white">
//                                                 <SelectValue placeholder="Select class" />
//                                             </SelectTrigger>
//                                             <SelectContent>
//                                                 <SelectItem value="warrior">Warrior</SelectItem>
//                                                 <SelectItem value="beast">Beast</SelectItem>
//                                                 <SelectItem value="fairy">Fairy</SelectItem>
//                                                 <SelectItem value="spellcaster">Spellcaster</SelectItem>
//                                                 <SelectItem value="serpent">Serpent</SelectItem>
//                                                 <SelectItem value="dragon">Dragon</SelectItem>
//                                                 <SelectItem value="rock">Rock</SelectItem>
//                                                 <SelectItem value="machine">Machine</SelectItem>
//                                                 <SelectItem value="fiend">Fiend</SelectItem>
//                                             </SelectContent>
//                                         </Select>
//                                     </div>
                                    
//                                     <div>
//                                         <Label htmlFor="character" className="text-white">Character</Label>
//                                         <Select 
//                                             value={formData.character} 
//                                             onValueChange={(value) => handleInputChange("character", value)}
//                                         >
//                                             <SelectTrigger className="bg-gray-700 text-white">
//                                                 <SelectValue placeholder="Select character" />
//                                             </SelectTrigger>
//                                             <SelectContent>
//                                                 <SelectItem value="normal">Normal</SelectItem>
//                                                 <SelectItem value="effect">Effect</SelectItem>
//                                                 <SelectItem value="fusion">Fusion</SelectItem>
//                                                 <SelectItem value="ritual">Ritual</SelectItem>
//                                             </SelectContent>
//                                         </Select>
//                                     </div>
                                    
//                                     <div>
//                                         <Label htmlFor="level" className="text-white">Level</Label>
//                                         <Input
//                                             id="level"
//                                             type="number"
//                                             min="1"
//                                             max="12"
//                                             value={formData.level}
//                                             onChange={(e) => handleInputChange("level", e.target.value)}
//                                             className="bg-gray-700 text-white"
//                                         />
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     )}

//                     {/* Market & Ownership */}
//                     <Card className="bg-gray-800 border-gray-700">
//                         <CardHeader>
//                             <CardTitle className="text-white">Market & Ownership</CardTitle>
//                         </CardHeader>
//                         <CardContent className="space-y-4">
//                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                                 <div>
//                                     <Label htmlFor="marketValue" className="text-white">Market Value</Label>
//                                     <Input
//                                         id="marketValue"
//                                         type="number"
//                                         value={formData.marketValue}
//                                         onChange={(e) => handleInputChange("marketValue", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                 </div>
                                
//                                 <div>
//                                     <Label htmlFor="boughtFor" className="text-white">Bought For</Label>
//                                     <Input
//                                         id="boughtFor"
//                                         type="number"
//                                         value={formData.boughtFor}
//                                         onChange={(e) => handleInputChange("boughtFor", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                 </div>
                                
//                                 <div>
//                                     <Label htmlFor="marketCount" className="text-white">Market Count</Label>
//                                     <Input
//                                         id="marketCount"
//                                         type="number"
//                                         value={formData.marketCount}
//                                         onChange={(e) => handleInputChange("marketCount", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                 </div>
                                
//                                 <div>
//                                     <Label htmlFor="passCount" className="text-white">Pass Count</Label>
//                                     <Input
//                                         id="passCount"
//                                         type="number"
//                                         value={formData.passCount}
//                                         onChange={(e) => handleInputChange("passCount", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                 </div>
//                             </div>

//                             <div className="grid grid-cols-2 gap-4">
//                                 <div>
//                                     <Label htmlFor="currentOwnerId" className="text-white">Owner ID</Label>
//                                     <Input
//                                         id="currentOwnerId"
//                                         value={formData.currentOwnerId}
//                                         onChange={(e) => handleInputChange("currentOwnerId", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                 </div>
                                
//                                 <div>
//                                     <Label htmlFor="currentOwnerUsername" className="text-white">Owner Username</Label>
//                                     <Input
//                                         id="currentOwnerUsername"
//                                         value={formData.currentOwnerUsername}
//                                         onChange={(e) => handleInputChange("currentOwnerUsername", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                 </div>
//                             </div>

//                             <div className="flex gap-4">
//                                 <label className="flex items-center space-x-2">
//                                     <input
//                                         type="checkbox"
//                                         checked={formData.isOwned}
//                                         onChange={(e) => handleInputChange("isOwned", e.target.checked)}
//                                         className="rounded"
//                                     />
//                                     <span className="text-white">Is Owned</span>
//                                 </label>
                                
//                                 <label className="flex items-center space-x-2">
//                                     <input
//                                         type="checkbox"
//                                         checked={formData.isListed}
//                                         onChange={(e) => handleInputChange("isListed", e.target.checked)}
//                                         className="rounded"
//                                     />
//                                     <span className="text-white">Is Listed</span>
//                                 </label>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Statistics */}
//                     <Card className="bg-gray-800 border-gray-700">
//                         <CardHeader>
//                             <CardTitle className="text-white">Statistics</CardTitle>
//                         </CardHeader>
//                         <CardContent className="space-y-4">
//                             <div>
//                                 <Label className="text-white block mb-2">Matches</Label>
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <Input
//                                         placeholder="Wins"
//                                         type="number"
//                                         value={formData.matchesWins}
//                                         onChange={(e) => handleInputChange("matchesWins", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                     <Input
//                                         placeholder="Total"
//                                         type="number"
//                                         value={formData.matchesTotal}
//                                         onChange={(e) => handleInputChange("matchesTotal", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                 </div>
//                             </div>

//                             <div>
//                                 <Label className="text-white block mb-2">Wins (Global/Local)</Label>
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <Input
//                                         placeholder="Global"
//                                         type="number"
//                                         value={formData.cardWinGlobal}
//                                         onChange={(e) => handleInputChange("cardWinGlobal", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                     <Input
//                                         placeholder="Local"
//                                         type="number"
//                                         value={formData.cardWinLocal}
//                                         onChange={(e) => handleInputChange("cardWinLocal", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                 </div>
//                             </div>

//                             <div>
//                                 <Label className="text-white block mb-2">Losses (Global/Local)</Label>
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <Input
//                                         placeholder="Global"
//                                         type="number"
//                                         value={formData.cardLoseGlobal}
//                                         onChange={(e) => handleInputChange("cardLoseGlobal", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                     <Input
//                                         placeholder="Local"
//                                         type="number"
//                                         value={formData.cardLoseLocal}
//                                         onChange={(e) => handleInputChange("cardLoseLocal", e.target.value)}
//                                         className="bg-gray-700 text-white"
//                                     />
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Submit Button */}
//                     <div className="flex justify-end">
//                         <Button
//                             type="submit"
//                             disabled={isLoading || !selectedImage}
//                             className="bg-blue-600 hover:bg-blue-700"
//                         >
//                             {isLoading ? "Creating..." : "Create Card"}
//                         </Button>
//                     </div>
//                 </form>
//             </div>
//         </main>
//     );
// }   