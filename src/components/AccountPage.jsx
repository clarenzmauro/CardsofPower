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

const AccountContent = ({ userData, userDocId }) => {
    return (
        <div className="flex-1 p-4 h-screen overflow-y-auto">
            {/* Profile Section with Circle and Info */}
            <div className="flex items-start mb-8">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex-shrink-0 mr-6">
                    <span className="text-center block mt-12">Profile Picture</span>
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
                    <div className="w-32 h-48 bg-gray-200"></div>
                    <div className="w-32 h-48 bg-gray-200"></div>
                    <div className="w-32 h-48 bg-gray-200"></div>
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
                    {[...Array(6)].map((_, index) => (
                        <div 
                            key={index} 
                            className="w-24 h-24 rounded-full bg-gray-200"
                        ></div>
                    ))}
                </div>

                {/* Rankings in two columns */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="flex flex-col gap-4">
                        <div className="h-48">
                            <h5>Strategist (WinRate)</h5>
                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="py-1">Player {i + 1}</div>
                                ))}
                            </div>
                        </div>
                        <div className="h-48">
                            <h5>King Midas (Gold Count)</h5>
                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="py-1">Player {i + 1}</div>
                                ))}
                            </div>
                        </div>
                        <div className="h-48">
                            <h5>Shop Raider</h5>
                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="py-1">Player {i + 1}</div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-4">
                        <div className="h-48">
                            <h5>Card Master (Card Count)</h5>
                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="py-1">Player {i + 1}</div>
                                ))}
                            </div>
                        </div>
                        <div className="h-48">
                            <h5>Artisan Supreme (Cards Created)</h5>
                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="py-1">Player {i + 1}</div>
                                ))}
                            </div>
                        </div>
                        <div className="h-48">
                            <h5>Friendly Neighborhood (highest Friend count)</h5>
                            <div className="h-40 overflow-y-auto bg-gray-100 p-2">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="py-1">Player {i + 1}</div>
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
        currentCardCount: PropTypes.number
    }),
    userDocId: PropTypes.string.isRequired
};

const BattlefieldContent = ({ userData }) => {
    // Data for the radar chart
    const radarData = [
        { subject: 'Monster', A: 80 },
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
                <div className="w-32 h-32 rounded-full bg-gray-200 flex flex-col items-center justify-center">
                    <span className="text-xl">{userData?.gamesPlayed || 30}</span>
                    <span>Matches</span>
                </div>
                <div className="w-32 h-32 rounded-full bg-gray-200 flex flex-col items-center justify-center">
                    <span className="text-xl">
                        {userData?.gamesPlayed ? 
                            ((userData.gamesWon / userData.gamesPlayed) * 100).toFixed(0) : 50}%
                    </span>
                    <span>Win Rate</span>
                </div>
                <div className="w-32 h-32 rounded-full bg-gray-200 flex flex-col items-center justify-center">
                    <span className="text-xl">13/15</span>
                    <span>Cards</span>
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
                    <input 
                        type="text" 
                        value="Highest Return of Investment: 0%"
                        readOnly 
                        className="bg-gray-100 p-2"
                    />
                </div>

                {/* Middle Column - Card Stats */}
                <div className="flex flex-col gap-4">
                    <input 
                        type="text" 
                        value="Highest Card Win Rate: (cardName lng)"
                        readOnly 
                        className="bg-gray-100 p-2"
                    />
                    <input 
                        type="text" 
                        value="Lowest Card Win Rate: (cardName lng)"
                        readOnly 
                        className="bg-gray-100 p-2"
                    />
                    <input 
                        type="text" 
                        value="Most Used Card: (cardName lng)"
                        readOnly 
                        className="bg-gray-100 p-2"
                    />
                    <input 
                        type="text" 
                        value="Most Expensive Card: (cardName lng)"
                        readOnly 
                        className="bg-gray-100 p-2"
                    />
                    <input 
                        type="text" 
                        value="Cheapest Card: (cardName lng)"
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

const EconomyContent = ({ userData }) => {
    // Sample data for graphs
    const goldData = [
        { name: 'Jan', gold: 400 },
        { name: 'Feb', gold: 300 },
        { name: 'Mar', gold: 600 },
        { name: 'Apr', gold: 800 },
        { name: 'May', gold: 700 }
    ];

    const cardData = [
        { name: 'Jan', cards: 10 },
        { name: 'Feb', cards: 15 },
        { name: 'Mar', cards: 13 },
        { name: 'Apr', cards: 17 },
        { name: 'May', cards: 20 }
    ];

    const pieData = [
        { name: 'Monster', value: 400 },
        { name: 'Spell', value: 300 },
        { name: 'Trap', value: 300 }
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

    return (
        <div className="flex-1 p-4 h-screen overflow-y-auto">
            {/* Top Row - Bar Graphs */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Gold Count Graph */}
                <div className="bg-gray-200 p-4 rounded-lg">
                    <h3 className="text-center mb-2">Gold Count Graph</h3>
                    <BarChart width={500} height={300} data={goldData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="gold" fill="#8884d8" />
                    </BarChart>
                </div>

                {/* Card Count Graph */}
                <div className="bg-gray-200 p-4 rounded-lg">
                    <h3 className="text-center mb-2">Card Count Graph</h3>
                    <BarChart width={500} height={300} data={cardData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="cards" fill="#82ca9d" />
                    </BarChart>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="relative">
                {/* Filter Dropdown */}
                <div className="absolute right-0 top-0 z-10">
                    <select className="bg-gray-200 p-2 rounded">
                        <option value="">Card Type</option>
                        <option value="">Card Attribute</option>
                        <option value="">Card Class</option>
                        <option value="">Card Characteristic</option>
                        <option value="">ROI</option>
                        <option value="">Winrate</option>
                        <option value="">Card Level</option>
                    </select>
                </div>

                {/* Card Shifts Graph (Pie Chart) */}
                <div className="mt-12 bg-gray-200 p-4 rounded-lg mx-auto w-2/3 flex justify-center">
                    <div>
                        <h3 className="text-center mb-2">Card Shifts Graph</h3>
                        <PieChart width={400} height={400}>
                            <Pie
                                data={pieData}
                                cx={200}
                                cy={200}
                                labelLine={false}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
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

BattlefieldContent.propTypes = {
    userData: PropTypes.shape({
        gamesPlayed: PropTypes.number,
        gamesWon: PropTypes.number,
        gamesLost: PropTypes.number
    })
};

EconomyContent.propTypes = {
    userData: PropTypes.shape({
        goldCount: PropTypes.number,
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
