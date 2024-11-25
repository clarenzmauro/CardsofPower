/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from "react";

import PropTypes from 'prop-types';

import { useParams } from "react-router-dom";

import {

    collection,

    getDoc,

    doc,

    getDocs,

    query,

    where,

    Timestamp

} from "firebase/firestore";

import { getStorage, ref, getDownloadURL } from "firebase/storage";

import { firestore } from "./firebaseConfig";

import "./AccountPage.css";

import {

    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,

    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,

    PieChart, Pie, Cell

} from 'recharts';

import profpic from "../assets/images/prof_pic8.jpg";



const AccountContent = ({ userData, userDocId }) => {



    const [topCards, setTopCards] = useState([]);

    const [leaderboards, setLeaderboards] = useState({

        strategist: [],

        kingMidas: [],

        shopRaider: [],

        cardMaster: [],

        artisan: [],

        friendly: []

    });

    const [userRanks, setUserRanks] = useState({

        strategist: 'N/A',

        cardMaster: 'N/A',

        kingMidas: 'N/A',

        artisan: 'N/A',

        shopRaider: 'N/A',

        friendly: 'N/A'

    });



    useEffect(() => {



        const fetchTopCards = async () => {

            if (!userData?.inventory) return;



            try {



                // Get all card documents referenced in inventory



                const cardPromises = userData.inventory.map(cardId => 

                    getDoc(doc(firestore, "cards", cardId))

                );



                const cardDocs = await Promise.all(cardPromises);



                // Process cards and get their image URLs



                const cardsWithMatches = await Promise.all(

                    cardDocs

                        .map(async doc => {

                            const cardData = doc.data();

                            let imageUrl = null;



                            if (cardData?.imageUrl) {

                                try {

                                    const storage = getStorage();

                                    const imageRef = ref(storage, cardData.imageUrl);

                                    imageUrl = await getDownloadURL(imageRef);

                                } catch (error) {

                                    console.error("Error getting image URL:", error);

                                }

                            }



                            return {

                                id: doc.id,

                                imageUrl: imageUrl,

                                matchCount: cardData?.cardMatch?.local || 0

                            };

                        })

                );



                // Sort by match count and take top 3



                const sortedCards = cardsWithMatches

                    .sort((a, b) => b.matchCount - a.matchCount)

                    .slice(0, 3);

                setTopCards(sortedCards);

            } catch (error) {

                console.error("Error fetching top cards:", error);

            }

        };



        fetchTopCards();



    }, [userData?.inventory]);



    useEffect(() => {

        const fetchLeaderboards = async () => {

            try {

                const usersRef = collection(firestore, "users");

                const usersSnap = await getDocs(usersRef);

                

                let strategistRankings = [];

                let midasRankings = [];

                let shopRaiderRankings = [];

                let cardMasterRankings = [];

                let artisanRankings = [];

                let friendlyRankings = [];

                

                usersSnap.forEach(doc => {

                    const userData = doc.data();

                    

                    // Strategist (Win Rate)

                    if (userData.gamesPlayed >= 5) {

                        const winRate = (userData.gamesWon / userData.gamesPlayed) * 100;

                        strategistRankings.push({

                            username: userData.username,

                            winRate: winRate

                        });

                    }

                    

                    // King Midas (Gold Count)

                    midasRankings.push({

                        username: userData.username,

                        goldCount: userData.highestGoldCount || 0

                    });

                    

                    // Shop Raider

                    const tradingScore = (userData.cardsBought || 0) + 

                                       (userData.cardsTraded || 0) + 

                                       (userData.cardsListed || 0);

                    shopRaiderRankings.push({

                        username: userData.username,

                        score: tradingScore

                    });

                    

                    // Card Master

                    cardMasterRankings.push({

                        username: userData.username,

                        cardCount: userData.highestCardCount || 0

                    });

                    

                    // Artisan Supreme

                    artisanRankings.push({

                        username: userData.username,

                        created: userData.cardsCreated || 0

                    });

                    

                    // Friendly Neighborhood

                    friendlyRankings.push({

                        username: userData.username,

                        friendCount: (userData.friends || []).length

                    });

                });



                // Sort all rankings first

                strategistRankings.sort((a, b) => b.winRate - a.winRate);

                cardMasterRankings.sort((a, b) => b.cardCount - a.cardCount);

                midasRankings.sort((a, b) => b.goldCount - a.goldCount);

                artisanRankings.sort((a, b) => b.created - a.created);

                shopRaiderRankings.sort((a, b) => b.score - a.score);

                friendlyRankings.sort((a, b) => b.friendCount - a.friendCount);



                // Then find positions in sorted arrays

                const ranks = {

                    strategist: 'N/A',

                    cardMaster: 'N/A',

                    kingMidas: 'N/A',

                    artisan: 'N/A',

                    shopRaider: 'N/A',

                    friendly: 'N/A'

                };



                // Find Strategist rank (only if qualified)

                if (userData?.gamesPlayed >= 5) {

                    const position = strategistRankings.findIndex(player => player.username === userData.username) + 1;

                    ranks.strategist = position || 'N/A';

                }



                // Find Card Master rank

                const cardMasterPosition = cardMasterRankings.findIndex(player => player.username === userData.username) + 1;

                ranks.cardMaster = cardMasterPosition || 'N/A';



                // Find King Midas rank

                const midasPosition = midasRankings.findIndex(player => player.username === userData.username) + 1;

                ranks.kingMidas = midasPosition || 'N/A';



                // Find Artisan Supreme rank

                const artisanPosition = artisanRankings.findIndex(player => player.username === userData.username) + 1;

                ranks.artisan = artisanPosition || 'N/A';



                // Find Shop Raider rank

                const shopPosition = shopRaiderRankings.findIndex(player => player.username === userData.username) + 1;

                ranks.shopRaider = shopPosition || 'N/A';



                // Find Friendly Neighborhood rank

                const friendlyPosition = friendlyRankings.findIndex(player => player.username === userData.username) + 1;

                ranks.friendly = friendlyPosition || 'N/A';



                setUserRanks(ranks);



                // Sort all rankings and take top 10

                setLeaderboards({

                    strategist: strategistRankings

                        .sort((a, b) => b.winRate - a.winRate)

                        .slice(0, 10),

                    kingMidas: midasRankings

                        .sort((a, b) => b.goldCount - a.goldCount)

                        .slice(0, 10),

                    shopRaider: shopRaiderRankings

                        .sort((a, b) => b.score - a.score)

                        .slice(0, 10),

                    cardMaster: cardMasterRankings

                        .sort((a, b) => b.cardCount - a.cardCount)

                        .slice(0, 10),

                    artisan: artisanRankings

                        .sort((a, b) => b.created - a.created)

                        .slice(0, 10),

                    friendly: friendlyRankings

                        .sort((a, b) => b.friendCount - a.friendCount)

                        .slice(0, 10)

                });

            } catch (error) {

                console.error("Error fetching leaderboards:", error);

            }

        };



        fetchLeaderboards();

    }, [userData?.username, userData?.gamesPlayed]);



    return (

        <div className="flex-1 p-4 h-screen overflow-y-auto">



            {/* Profile Section with Circle and Info */}



            <div className="flex items-start mb-8">

                <div className="w-32 h-32 rounded-full bg-gray-200 flex-shrink-0 mr-6 overflow-hidden">

                    <img src={profpic} alt="Profile" className="w-full h-full object-cover" />

                </div>



                <div className="flex flex-col gap-2 flex-grow">

                    <input 

                        type="text" 

                        value={userData?.username || 'Username'} 

                        readOnly 

                        className="bg-gray-100 p-2"

                    />



                    <input 

                        type="text" 

                        value={`Account ID: ${userDocId}`} 

                        readOnly 

                        className="bg-gray-100 p-2"

                    />



                    <input 

                        type="text" 

                        value={`Date Created: ${userData?.dateCreated?.toDate().toLocaleDateString() || ''}`} 

                        readOnly 

                        className="bg-gray-100 p-2"

                    />

                </div>

            </div>



            {/* Cards Section */}



            <div className="mt-4">

                <h3>Cards (3 most used)</h3>

                <div className="flex gap-4 mt-2">

                    {[0, 1, 2].map((index) => (

                        <div 

                            key={index}

                            className="w-32 h-48 bg-gray-200 overflow-hidden"

                        >

                            {topCards[index]?.imageUrl ? (

                                <img 

                                    src={topCards[index].imageUrl} 

                                    alt={`Most used card ${index + 1}`}

                                    className="w-full h-full object-cover"

                                />

                            ) : (

                                <div className="w-full h-full bg-black bg-opacity-50" />

                            )}

                        </div>

                    ))}

                </div>

            </div>



            {/* Stats Section */}



            <div className="mt-4 text-right">

                <p>Matches Played: {userData?.gamesPlayed || 0}</p>

                <p>Cards Owned: {userData?.currentCardCount || 0}</p>

            </div>



            {/* Leaderboard Section */}



            <div className="mt-4">

                <h3>Leaderboard</h3>

                <h4>Server Rankings</h4>



                {/* Profile Circles */}



                <div className="flex justify-between mt-4 mb-6">

                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">

                        <span className="text-xl font-bold">{userRanks.strategist}</span>

                    </div>

                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">

                        <span className="text-xl font-bold">{userRanks.cardMaster}</span>

                    </div>

                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">

                        <span className="text-xl font-bold">{userRanks.kingMidas}</span>

                    </div>

                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">

                        <span className="text-xl font-bold">{userRanks.artisan}</span>

                    </div>

                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">

                        <span className="text-xl font-bold">{userRanks.shopRaider}</span>

                    </div>

                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">

                        <span className="text-xl font-bold">{userRanks.friendly}</span>

                    </div>

                </div>



                {/* Rankings in two columns */}



                <div className="grid grid-cols-2 gap-4">



                    {/* Left Column */}



                    <div className="flex flex-col gap-4">

                        <div className="h-48">

                            <h5>Strategist (WinRate)</h5>

                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">

                                {leaderboards.strategist.length > 0 ? (

                                    leaderboards.strategist.map((player, i) => (

                                        <div key={i} className="py-1">

                                            {player.username} ({player.winRate.toFixed(2)}%)

                                        </div>

                                    ))

                                ) : (

                                    <div className="text-red-500 py-1">

                                        Play at least 5 games to qualify

                                    </div>

                                )}

                            </div>

                        </div>



                        <div className="h-48">

                            <h5>King Midas (Gold Count)</h5>

                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">

                                {leaderboards.kingMidas.map((player, i) => (

                                    <div key={i} className="py-1">

                                        {player.username} ({player.goldCount.toLocaleString()})

                                    </div>

                                ))}

                            </div>

                        </div>



                        <div className="h-48">

                            <h5>Shop Raider</h5>

                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">

                                {leaderboards.shopRaider.map((player, i) => (

                                    <div key={i} className="py-1">

                                        {player.username} ({player.score})

                                    </div>

                                ))}

                            </div>

                        </div>

                    </div>



                    {/* Right Column */}



                    <div className="flex flex-col gap-4">

                        <div className="h-48">

                            <h5>Card Master (Card Count)</h5>

                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">

                                {leaderboards.cardMaster.map((player, i) => (

                                    <div key={i} className="py-1">

                                        {player.username} ({player.cardCount})

                                    </div>

                                ))}

                            </div>

                        </div>



                        <div className="h-48">

                            <h5>Artisan Supreme (Cards Created)</h5>

                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">

                                {leaderboards.artisan.map((player, i) => (

                                    <div key={i} className="py-1">

                                        {player.username} ({player.created})

                                    </div>

                                ))}

                            </div>

                        </div>



                        <div className="h-48">

                            <h5>Friendly Neighborhood</h5>

                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">

                                {leaderboards.friendly.map((player, i) => (

                                    <div key={i} className="py-1">

                                        {player.username} ({player.friendCount})

                                    </div>

                                ))}

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

};



AccountContent.propTypes = {

    userData: PropTypes.shape({

        username: PropTypes.string,

        dateCreated: PropTypes.shape({

            toDate: PropTypes.func

        }),



        gamesPlayed: PropTypes.number,

        gamesWon: PropTypes.number,

        currentCardCount: PropTypes.number,

        inventory: PropTypes.arrayOf(PropTypes.string),

        highestCardCount: PropTypes.number,

        highestGoldCount: PropTypes.number,

        cardsBought: PropTypes.number,

        cardsTraded: PropTypes.number,

        cardsListed: PropTypes.number,

        cardsCreated: PropTypes.number,

        friends: PropTypes.arrayOf(PropTypes.string)

    }),



    userDocId: PropTypes.string.isRequired

};



const BattlefieldContent = ({ userData }) => {

    const [highestRoi, setHighestRoi] = useState(null);

    const [isLoadingRoi, setIsLoadingRoi] = useState(true);

    const [highestWinRateCard, setHighestWinRateCard] = useState({ name: '', winRate: 0 });

    const [isLoadingWinRate, setIsLoadingWinRate] = useState(true);

    const [lowestWinRateCard, setLowestWinRateCard] = useState({ name: '', winRate: 100 });

    const [isLoadingWinRates, setIsLoadingWinRates] = useState(true);

    const [mostUsedCard, setMostUsedCard] = useState({ name: '', matches: 0 });

    const [isLoadingMostUsed, setIsLoadingMostUsed] = useState(true);

    const [expensiveCard, setExpensiveCard] = useState({ name: '', price: 0 });

    const [cheapestCard, setCheapestCard] = useState({ name: '', price: 0 });

    const [isLoadingCardPrices, setIsLoadingCardPrices] = useState(true);



    useEffect(() => {

        const fetchHighestRoi = async () => {

            if (!userData?.inventory) {



                setHighestRoi(0);



                setIsLoadingRoi(false);



                return;

            }



            try {

                const cardPromises = userData.inventory.map(cardId => 

                    getDoc(doc(firestore, "cards", cardId))

                );



                const cardDocs = await Promise.all(cardPromises);

                const rois = cardDocs.map(doc => doc.data()?.roi || 0);

                const maxRoi = Math.max(...rois);



                setHighestRoi(maxRoi);



            } catch (error) {

                console.error("Error fetching ROI data:", error);



                setHighestRoi(0);

            } finally {



                setIsLoadingRoi(false);

            }

        };



        fetchHighestRoi();



    }, [userData?.inventory]);



    useEffect(() => {

        const fetchCardPrices = async () => {

            if (!userData?.inventory) {

                setExpensiveCard({ name: 'N/A', price: 0 });

                setCheapestCard({ name: 'N/A', price: 0 });

                setIsLoadingCardPrices(false);

                return;

            }



            try {

                const cardPromises = userData.inventory.map(cardId => 

                    getDoc(doc(firestore, "cards", cardId))

                );

                const cardDocs = await Promise.all(cardPromises);

                

                let mostExpensive = { name: 'N/A', price: 0 };

                let cheapest = { name: 'N/A', price: Number.MAX_VALUE };

                

                cardDocs.forEach(doc => {

                    const cardData = doc.data();

                    const price = cardData.boughtFor || 0;

                    

                    // Skip free cards

                    if (price === 0) return;

                    

                    // Check for most expensive

                    if (price > mostExpensive.price) {

                        mostExpensive = {

                            name: cardData.cardName || 'N/A',

                            price: price

                        };

                    }

                    

                    // Check for cheapest (only non-zero prices)

                    if (price < cheapest.price) {

                        cheapest = {

                            name: cardData.cardName || 'N/A',

                            price: price

                        };

                    }

                });



                // If no paid cards found, reset cheapest

                if (cheapest.price === Number.MAX_VALUE) {

                    cheapest = { name: 'N/A', price: 0 };

                }



                setExpensiveCard(mostExpensive);

                setCheapestCard(cheapest);

            } catch (error) {

                console.error("Error fetching card prices:", error);

                setExpensiveCard({ name: 'N/A', price: 0 });

                setCheapestCard({ name: 'N/A', price: 0 });

            } finally {

                setIsLoadingCardPrices(false);

            }

        };



        fetchCardPrices();

    }, [userData?.inventory]);



    useEffect(() => {

        const fetchWinRateCards = async () => {

            if (!userData?.inventory) {



                setHighestWinRateCard({ name: '', winRate: 0 });



                setLowestWinRateCard({ name: '', winRate: 0 });



                setIsLoadingWinRates(false);



                return;

            }



            try {

                const cardPromises = userData.inventory.map(cardId => 

                    getDoc(doc(firestore, "cards", cardId))

                );



                const cardDocs = await Promise.all(cardPromises);

                let highestCard = { name: '', winRate: 0 };

                let lowestCard = { name: '', winRate: 100 };



                cardDocs.forEach(doc => {

                    const cardData = doc.data();

                    const matches = cardData?.cardMatch?.local || 0;

                    const wins = cardData?.cardWin?.local || 0;

                    const winRate = matches > 0 ? (wins / matches) * 100 : 0;



                    if (matches > 0) {

                        if (winRate > highestCard.winRate) {

                            highestCard = {

                                name: cardData.cardName || '',

                                winRate: winRate

                            };

                        }



                        if (winRate < lowestCard.winRate) {

                            lowestCard = {

                                name: cardData.cardName || '',

                                winRate: winRate

                            };

                        }

                    }

                });



                setHighestWinRateCard(highestCard);



                setLowestWinRateCard(lowestCard);

            } catch (error) {

                console.error("Error fetching win rate data:", error);



                setHighestWinRateCard({ name: '', winRate: 0 });



                setLowestWinRateCard({ name: '', winRate: 0 });

            } finally {



                setIsLoadingWinRates(false);

            }

        };



        fetchWinRateCards();

    }, [userData?.inventory]);



    useEffect(() => {

        const fetchMostUsedCard = async () => {

            if (!userData?.inventory) {

                setMostUsedCard({ name: 'N/A', matches: 0 });



                setIsLoadingMostUsed(false);



                return;

            }



            try {

                const cardPromises = userData.inventory.map(cardId => 

                    getDoc(doc(firestore, "cards", cardId))

                );



                const cardDocs = await Promise.all(cardPromises);

                let highestMatchCard = { name: 'N/A', matches: 0 };



                cardDocs.forEach(doc => {

                    const cardData = doc.data();

                    const matches = cardData?.cardMatch?.local || 0;



                    if (matches > highestMatchCard.matches) {

                        highestMatchCard = {

                            name: cardData.cardName || 'N/A',

                            matches: matches

                        };

                    }

                });



                setMostUsedCard(highestMatchCard);



            } catch (error) {

                console.error("Error fetching most used card:", error);



                setMostUsedCard({ name: 'N/A', matches: 0 });

            } finally {



                setIsLoadingMostUsed(false);

            }

        };



        fetchMostUsedCard();



    }, [userData?.inventory]);



    const formatRoi = (roi) => {

        const formattedNumber = Math.abs(roi).toLocaleString();



        if (roi > 0) return `+${formattedNumber}`;



        if (roi < 0) return `-${formattedNumber}`;

        

        return "0";

    };



    const getRoiColor = (roi) => {

        if (roi > 0) return "text-green-500";



        if (roi < 0) return "text-red-500";



        return "text-white";

    };



    // Data for the radar chart



    const radarData = [

        { subject: 'Monster', A: 50 },

        { subject: 'Spell', A: 65 },

        { subject: 'Damage', A: 90 },

        { subject: 'Sustain', A: 75 },

        { subject: 'Buff', A: 70 },

        { subject: 'Trap', A: 85 }

    ];



    return (

        <div className="flex-1 p-4 h-screen overflow-y-auto">



            {/* Top Circles */}



            <div className="flex justify-around mb-8">

                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex flex-col items-center justify-center text-white shadow-lg">

                    <span className="text-2xl font-bold">{userData?.gamesPlayed || 0}</span>

                    <span className="text-sm">Matches</span>

                </div>

                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex flex-col items-center justify-center text-white shadow-lg">

                    <span className="text-2xl font-bold">

                        {userData?.gamesPlayed ? 

                            ((userData.gamesWon / userData.gamesPlayed) * 100).toFixed(2) : 0}%

                    </span>



                    <span className="text-sm">Win Rate</span>

                </div>



                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex flex-col items-center justify-center text-white shadow-lg">

                    <span className="text-2xl font-bold">{userData?.currentCardCount||0}/{userData?.highestCardCount||0}</span>

                    <span className="text-sm">Cards</span>

                </div>

            </div>



            {/* Main Content Grid */}



            <div className="grid grid-cols-3 gap-4">



                {/* Left Column - Stats */}



                <div className="flex flex-col gap-4">



                    <input 

                        type="text" 

                        value={`Matches Won: ${userData?.gamesWon || 0}`}

                        readOnly 

                        className="bg-gray-100 p-2"

                    />



                    <input

                        type="text"

                        value={`Matches Lost: ${userData?.gamesLost || 0}`}

                        readOnly 

                        className="bg-gray-100 p-2"

                    />



                    <input 

                        type="text" 

                        value={`Highest Card Count: ${userData?.highestCardCount || 0}`}

                        readOnly 

                        className="bg-gray-100 p-2"

                    />



                    <input 

                        type="text" 

                        value={`Highest Gold Count: ${userData?.highestGoldCount || 0}`}

                        readOnly 

                        className="bg-gray-100 p-2"

                    />



                    <div className="bg-gray-100 p-2 flex items-center">

                        <span className="mr-2">Highest Return of Investment:</span>



                        {isLoadingRoi ? (

                            <span className="animate-pulse">Loading...</span>

                        ) : (

                            <span className={getRoiColor(highestRoi)}>

                                {formatRoi(highestRoi)}

                            </span>

                        )}

                    </div>

                </div>



                {/* Middle Column - Card Stats */}



                <div className="flex flex-col gap-4">



                    <input 

                        type="text"

                        value={isLoadingWinRates ? 

                            "Highest Card Win Rate: Loading..." : 

                            `Highest Card Win Rate: ${highestWinRateCard.name} (${highestWinRateCard.winRate.toFixed(2)}%)`

                        }

                        readOnly 

                        className="bg-gray-100 p-2"

                    />



                    <input 

                        type="text" 

                        value={isLoadingWinRates ? 

                            "Lowest Card Win Rate: Loading..." : 

                            `Lowest Card Win Rate: ${lowestWinRateCard.name} (${lowestWinRateCard.winRate.toFixed(2)}%)`

                        }

                        readOnly 

                        className="bg-gray-100 p-2"

                    />



                    <input

                        type="text"

                        value={isLoadingMostUsed ? 

                            "Most Used Card: Loading..." : 

                            `Most Used Card: ${mostUsedCard.name} (${mostUsedCard.matches} matches)`

                        }

                        readOnly 

                        className="bg-gray-100 p-2"

                    />

                

                    <input 

                        type="text" 

                        value={isLoadingCardPrices ? 

                            "Most Expensive Card: Loading..." : 

                            `Most Expensive Card: ${expensiveCard.name} (${expensiveCard.price.toLocaleString()})`

                        }

                        readOnly 

                        className="bg-gray-100 p-2"

                    />



                    <input 

                        type="text" 

                        value={isLoadingCardPrices ? 

                            "Cheapest Card: Loading..." : 

                            `Cheapest Card: ${cheapestCard.name} (${cheapestCard.price.toLocaleString()})`

                        }

                        readOnly 

                        className="bg-gray-100 p-2"

                    />

                </div>



                {/* Right Column - Radar Chart */}



                <div className="flex justify-center items-center">

                    <RadarChart width={300} height={300} data={radarData}>

                        <PolarGrid />

                        <PolarAngleAxis dataKey="subject" />

                        <PolarRadiusAxis angle={30} domain={[0, 100]} />

                        <Radar

                            name="Stats"

                            dataKey="A"

                            stroke="#2E555B"

                            fill="#2E555B"

                            fillOpacity={0.6}

                        />

                    </RadarChart>

                </div>

            </div>

        </div>

    );

};



BattlefieldContent.propTypes = {

    userData: PropTypes.shape({

        gamesPlayed: PropTypes.number,

        gamesWon: PropTypes.number,

        gamesLost: PropTypes.number,

        currentCardCount: PropTypes.number,

        highestCardCount: PropTypes.number,

        highestGoldCount: PropTypes.number,

        inventory: PropTypes.arrayOf(PropTypes.string)

    })

};



const EconomyContent = ({ userData }) => {

    // Data for gold and card counts

    const goldData = [

        { name: 'Current', value: userData?.goldCount || 0 },

        { name: 'Highest', value: userData?.highestGoldCount || 0 }

    ];



    const cardData = [

        { name: 'Current', value: userData?.currentCardCount || 0 },

        { name: 'Highest', value: userData?.highestCardCount || 0 }

    ];



    const pieData = [

        { name: 'Monster', value: 400 },

        { name: 'Spell', value: 300 },

        { name: 'Trap', value: 300 }

    ];



    const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];



    // Calculate percentages

    const calculatePercentage = (current, highest) => {

        if (current === 0) return -100;

        return ((current - highest) / highest * 100).toFixed(2);

    };



    const goldPercentage = calculatePercentage(userData?.goldCount || 0, userData?.highestGoldCount || 0);

    const cardPercentage = calculatePercentage(userData?.currentCardCount || 0, userData?.highestCardCount || 0);



    // Custom tooltip component

    const CustomTooltip = ({ active, payload, label }) => {

        if (active && payload && payload.length) {

            return (

                <div className="bg-white p-2 border rounded shadow">

                    <p>{`${label}: ${payload[0].value.toLocaleString()}`}</p>

                </div>

            );

        }

        return null;

    };



    const [selectedFilter, setSelectedFilter] = useState('Card Type');

    const [pieChartData, setPieChartData] = useState([]);

    const [isLoadingPieChart, setIsLoadingPieChart] = useState(true);



    // Function to process cards based on filter

    useEffect(() => {

        const processCardData = async () => {

            if (!userData?.inventory) {

                setPieChartData([]);

                setIsLoadingPieChart(false);

                return;

            }



            try {

                setIsLoadingPieChart(true);

                const cardPromises = userData.inventory.map(cardId => 

                    getDoc(doc(firestore, "cards", cardId))

                );

                const cardDocs = await Promise.all(cardPromises);

                const cards = cardDocs.map(doc => doc.data());



                let data = [];

                switch(selectedFilter) {

                    case 'Card Type':

                        const typeCount = {monster: 0, spell: 0, trap: 0};

                        cards.forEach(card => {

                            if (card.cardType) typeCount[card.cardType]++;

                        });

                        data = Object.entries(typeCount).map(([name, value]) => ({name, value}));

                        break;



                    case 'Card Attribute':

                        const attrCount = {fire: 0, water: 0, wind: 0, earth: 0, light: 0, dark: 0, divine: 0};

                        cards.forEach(card => {

                            if (card.cardAttribute) attrCount[card.cardAttribute]++;

                        });

                        data = Object.entries(attrCount).map(([name, value]) => ({name, value}));

                        break;



                    case 'Card Class':
                        
                        const classCount = {

                            rock: 0, machine: 0, warrior: 0, beast: 0, 

                            dragon: 0, serpent: 0, spellcaster: 0, reptile: 0,
                            fairy:0

                        };

                        cards.forEach(card => {

                            if (card.cardClass) classCount[card.cardClass]++;

                        });

                        data = Object.entries(classCount).map(([name, value]) => ({name, value}));

                        break;



                    case 'Card Characteristic':

                        const charCount = {normal: 0, effect: 0, fusion: 0, ritual: 0};

                        cards.forEach(card => {

                            if (card.cardCharacter) charCount[card.cardCharacter]++;

                        });

                        data = Object.entries(charCount).map(([name, value]) => ({name, value}));

                        break;



                    case 'ROI':

                        const roiCount = {Negative: 0, Zero: 0, Positive: 0};

                        cards.forEach(card => {

                            const roi = card.roi || 0;

                            if (roi < 0) roiCount.Negative++;

                            else if (roi > 0) roiCount.Positive++;

                            else roiCount.Zero++;

                        });

                        data = Object.entries(roiCount).map(([name, value]) => ({name, value}));

                        break;



                    case 'Winrate':

                        const winCount = {'Below 50%': 0, '50%': 0, 'Above 50%': 0};

                        cards.forEach(card => {

                            const matches = card?.cardMatch?.local || 0;

                            const wins = card?.cardWin?.local || 0;

                            const winRate = matches > 0 ? (wins / matches) * 100 : 0;

                            if (winRate < 50) winCount['Below 50%']++;

                            else if (winRate > 50) winCount['Above 50%']++;

                            else winCount['50%']++;

                        });

                        data = Object.entries(winCount).map(([name, value]) => ({name, value}));

                        break;



                    case 'Card Level':

                        const levelCount = {

                            1: 0, 2: 0, 3: 0, 4: 0, 5: 0,

                            6: 0, 7: 0, 8: 0, 9: 0, 10: 0

                        };

                        cards.forEach(card => {

                            if (card.cardLevel) levelCount[card.cardLevel]++;

                        });

                        data = Object.entries(levelCount).map(([name, value]) => ({name, value}));

                        break;



                    default:

                        data = [];

                }



                setPieChartData(data);

            } catch (error) {

                console.error("Error processing card data:", error);

                setPieChartData([]);

            } finally {

                setIsLoadingPieChart(false);

            }

        };



        processCardData();

    }, [userData?.inventory, selectedFilter]);



    return (

        <div className="flex-1 p-4 h-screen overflow-y-auto">

            {/* Top Row - Bar Graphs */}

            <div className="grid grid-cols-2 gap-8 mb-8">

                {/* Gold Count Graph */}

                <div className="bg-gray-200 p-4 rounded-lg relative">

                    <h3 className="text-center mb-2">Gold Count Graph</h3>

                    <div className="flex items-center">

                        <BarChart width={400} height={300} data={goldData}>

                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="name" />

                            <YAxis />

                            <Tooltip content={<CustomTooltip />} />

                            <Bar dataKey="value" fill="#FFD700" />

                        </BarChart>

                        <div className={`ml-4 font-bold ${

                            goldPercentage == 0 ? 'text-white' : 

                            goldPercentage > 0 ? 'text-green-500' : 'text-red-500'

                        }`}>

                            {goldPercentage > 0 ? `+${goldPercentage}` : goldPercentage}%

                        </div>

                    </div>

                </div>



                {/* Card Count Graph */}

                <div className="bg-gray-200 p-4 rounded-lg relative">

                    <h3 className="text-center mb-2">Card Count Graph</h3>

                    <div className="flex items-center">

                        <BarChart width={400} height={300} data={cardData}>

                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="name" />

                            <YAxis />

                            <Tooltip content={<CustomTooltip />} />

                            <Bar dataKey="value" fill="#82ca9d" />

                        </BarChart>

                        <div className={`ml-4 font-bold ${

                            cardPercentage == 0 ? 'text-white' : 

                            cardPercentage > 0 ? 'text-green-500' : 'text-red-500'

                        }`}>

                            {cardPercentage > 0 ? `+${cardPercentage}` : cardPercentage}%

                        </div>

                    </div>

                </div>

            </div>



            {/* Bottom Section */}

            <div className="relative">

                {/* Filter Dropdown */}

                <div className="absolute right-0 top-0 z-10">

                    <select 

                        className="bg-gray-200 p-2 rounded"

                        value={selectedFilter}

                        onChange={(e) => setSelectedFilter(e.target.value)}

                    >

                        <option value="Card Type">Card Type</option>

                        <option value="Card Attribute">Card Attribute</option>

                        <option value="Card Class">Card Class</option>

                        <option value="Card Characteristic">Card Characteristic</option>

                        <option value="ROI">ROI</option>

                        <option value="Winrate">Winrate</option>

                        <option value="Card Level">Card Level</option>

                    </select>

                </div>



                {/* Card Shifts Graph (Pie Chart) */}

                <div className="mt-12 bg-gray-200 p-4 rounded-lg mx-auto w-2/3 flex justify-center">

                    <div>

                        <h3 className="text-center mb-2">Card Shifts Graph</h3>

                        <PieChart width={400} height={400}>

                            <Pie

                                data={pieChartData}

                                cx={200}

                                cy={200}

                                labelLine={false}

                                outerRadius={150}

                                fill="#8884d8"

                                dataKey="value"

                            >

                                {pieChartData.map((entry, index) => (

                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />

                                ))}

                            </Pie>

                            <Tooltip />

                            <Legend />

                        </PieChart>

                    </div>

                </div>

            </div>

        </div>

    );

};



EconomyContent.propTypes = {

    userData: PropTypes.shape({

        goldCount: PropTypes.number,

        highestGoldCount: PropTypes.number,

        currentCardCount: PropTypes.number,

        highestCardCount: PropTypes.number,

        cardsBought: PropTypes.number,

        cardsSold: PropTypes.number,

        cardsTraded: PropTypes.number

    })

};



const AccountPage = () => {

    const { userDocId } = useParams();

    const [activeTab, setActiveTab] = useState('account');

    const [userData, setUserData] = useState(null);

    const [isLoading, setIsLoading] = useState(true);

    const [error, setError] = useState(null);



    useEffect(() => {

        const fetchUserData = async () => {



            try {

                const userDocRef = doc(firestore, "users", userDocId);

                const userDocSnap = await getDoc(userDocRef);



                if (userDocSnap.exists()) {

                    setUserData(userDocSnap.data());

                    console.log("User Data:", userDocSnap.data());

                } else {

                    setError("User not found");

                }

            } catch (err) {

                console.error("Error fetching user data:", err);

                setError("Failed to load user data");

            } finally {

                setIsLoading(false);

            }

        };



        fetchUserData();

    }, [userDocId]);



    if (isLoading) return <div>Loading...</div>;

    if (error) return <div>Error: {error}</div>;



    const renderContent = () => {

        switch(activeTab) {

            case 'account':

                return <AccountContent userData={userData} userDocId={userDocId} />;

            case 'battlefield':

                return <BattlefieldContent userData={userData} />;

            case 'economy':

                return <EconomyContent userData={userData} />;

            default:

                return <AccountContent userData={userData} userDocId={userDocId} />;

        }

    };



    return (

        <div className="flex">



            {/* Left Navigation */}



            <div className="w-48 bg-gray-300">

                <div className={`p-4 ${activeTab === 'account' ? 'bg-gray-500' : ''}`}

                    onClick={() => setActiveTab('account')}>

                    Account

                </div>



                <div className={`p-4 ${activeTab === 'battlefield' ? 'bg-gray-500' : ''}`}

                    onClick={() => setActiveTab('battlefield')}>

                    Battlefield

                </div>



                <div className={`p-4 ${activeTab === 'economy' ? 'bg-gray-500' : ''}`}

                    onClick={() => setActiveTab('economy')}>

                    Economy

                </div>

            </div>



            {/* Main Content */}



            {renderContent()}

        </div>

    );

};



export default AccountPage;
