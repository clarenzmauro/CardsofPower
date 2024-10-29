// Battlefield.jsx
import React, { useState, useEffect } from 'react';
import { storage, database } from './firebaseConfig'; // Import Storage and Database instances
import {
    ref as dbRef,
    set,
    push,
    onValue,
    update,
    remove
} from 'firebase/database'; // Realtime Database ref functions
import {
    ref as storageRef,
    getDownloadURL
} from 'firebase/storage'; // Storage ref functions

import './Battlefield.css';

import backCard from '../assets/cards/back-card.png'; // Local fallback
import graveyardCard from '../assets/cards/graveyard.png';

const placeholderCard = backCard;

function Battlefield() {
    const [background, setBackground] = useState('');
    const [leftButton, setLeftButton] = useState('');
    const [rightButton, setRightButton] = useState('');
    const [opponentCards, setOpponentCards] = useState([]);
    const [myCards, setMyCards] = useState([]);
    const [myDeck, setMyDeck] = useState([]);
    const [lastCard, setLastCard] = useState(placeholderCard); // Default last card

    // Multiplayer state variables
    const [roomId, setRoomId] = useState('');
    const [playerId, setPlayerId] = useState('');
    const [username, setUsername] = useState('');
    const [isRoomJoined, setIsRoomJoined] = useState(false);
    const [gameStage, setGameStage] = useState('lobby'); // 'lobby', 'waiting', 'preparation', 'battle', 'finished'
    const [timer, setTimer] = useState(60); // Initial timer value
    const [currentRound, setCurrentRound] = useState(0);
    const totalRounds = 10;

    // Fetch Firebase assets on component mount
    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const [bgUrl, leftBtnUrl, rightBtnUrl] = await Promise.all([
                    getDownloadURL(storageRef(storage, 'assets/backgrounds/battlefield.jpg')),
                    getDownloadURL(storageRef(storage, 'assets/others/leftBtn.png')),
                    getDownloadURL(storageRef(storage, 'assets/others/rightBtn.png')),
                ]);

                setBackground(bgUrl);
                setLeftButton(leftBtnUrl);
                setRightButton(rightBtnUrl);

                const cardPaths = [
                    'assets/cards/Divine/AethersWrath.png',
                    'assets/cards/Divine/BaneOfExistence.png',
                    'assets/cards/Divine/CelestialOutcast.png',
                    'assets/cards/Divine/CelestialZenith.png',
                    'assets/cards/Divine/ForgemasterOfCreation.png',
                    'assets/cards/Earth/EarthGolem.png',
                    'assets/cards/Earth/HeartOfTheMountain.png',
                    'assets/cards/Earth/IroncladDefender.png',
                    'assets/cards/Earth/SteelGuardian.png',
                    'assets/cards/Earth/StoneSentinel.png',
                    'assets/cards/Light/CrystalGuardian.png',
                    'assets/cards/Light/ElectricSabre.png',
                    'assets/cards/Light/LightbinderPaladin.png',
                    'assets/cards/Light/LunarWolf.png',
                    'assets/cards/Light/SolarGuardian.png',
                ];

                const urls = await Promise.all(
                    cardPaths.map((path) => getDownloadURL(storageRef(storage, path)))
                );

                setOpponentCards([urls[0], placeholderCard, urls[1], placeholderCard, placeholderCard]);
                setMyCards([placeholderCard, urls[2], placeholderCard, urls[3], urls[4]]);
                setMyDeck(urls.slice(5, 15));
                setLastCard(urls[0]); // Set initial last card dynamically
            } catch (error) {
                console.error('Error fetching Firebase assets:', error);
            }
        };

        fetchAssets();
    }, []);

    // Handle multiplayer game state synchronization
    useEffect(() => {
        if (isRoomJoined && roomId && playerId) {
            const roomRef = dbRef(database, `rooms/${roomId}`);

            // Listen to gameState changes
            const gameStateRef = dbRef(database, `rooms/${roomId}/gameState`);
            const unsubscribeGameState = onValue(gameStateRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    console.log('Game State Updated:', data);
                    setGameStage(data.gameStage);
                    setTimer(data.timer);
                    setCurrentRound(data.currentRound);
                }
            });

            // Listen to lastCard changes
            const lastCardRef = dbRef(database, `rooms/${roomId}/lastCard`);
            const unsubscribeLastCard = onValue(lastCardRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setLastCard(data);
                }
            });

            // Listen to players count
            const playersRef = dbRef(database, `rooms/${roomId}/players`);
            const unsubscribePlayers = onValue(playersRef, (snapshot) => {
                const players = snapshot.val();
                const playerCount = players ? Object.keys(players).length : 0;

                if (playerCount === 2) {
                    if (playerId === 'player1') {
                        // Only player1 sets the gameStage and timer
                        console.log('Both players have joined. Starting preparation stage.');
                        setGameStage('preparation');
                        setTimer(60);
                        updateGameState('gameStage', 'preparation');
                        updateGameState('timer', 60);
                    }
                }
            });

            return () => {
                unsubscribeGameState();
                unsubscribeLastCard();
                unsubscribePlayers();
            };
        }
    }, [isRoomJoined, roomId, playerId]);

    // Handle game timer synchronization
    useEffect(() => {
        let interval = null;

        if (gameStage === 'preparation') {
            if (playerId === 'player1') { // Only player1 manages the timer
                if (timer > 0) {
                    interval = setInterval(() => {
                        setTimer(prevTimer => {
                            const newTimer = prevTimer - 1;
                            updateGameState('timer', newTimer);
                            return newTimer;
                        });
                    }, 1000);
                } else {
                    updateGameState('gameStage', 'battle');
                    setGameStage('battle');
                    setTimer(30); // Example: 30 seconds per battle round
                    setCurrentRound(1);
                    updateGameState('timer', 30);
                    updateGameState('currentRound', 1);
                }
            }
        } else if (gameStage === 'battle') {
            if (playerId === 'player1') { // Only player1 manages the timer
                if (currentRound <= totalRounds) {
                    if (timer > 0) {
                        interval = setInterval(() => {
                            setTimer(prevTimer => {
                                const newTimer = prevTimer - 1;
                                updateGameState('timer', newTimer);
                                return newTimer;
                            });
                        }, 1000);
                    } else {
                        // Round ended, proceed to next round or finish
                        if (currentRound < totalRounds) {
                            setCurrentRound(prevRound => {
                                const updatedRound = prevRound + 1;
                                updateGameState('currentRound', updatedRound);
                                return updatedRound;
                            });
                            setTimer(30); // Reset timer for next round
                            updateGameState('timer', 30);
                        } else {
                            setGameStage('finished');
                            updateGameState('gameStage', 'finished');
                        }
                    }
                }
            }
        }

        return () => clearInterval(interval);
    }, [gameStage, timer, currentRound, playerId]);

    // Function to create a new game room
    const createRoom = async () => {
        if (!username) {
            alert('Please enter a username.');
            return;
        }

        const newRoomRef = push(dbRef(database, 'rooms'));
        const newRoomId = newRoomRef.key;

        setRoomId(newRoomId);
        setPlayerId('player1');
        setIsRoomJoined(true);

        // Initialize room data with gameStage as 'waiting'
        await set(newRoomRef, {
            players: {
                player1: {
                    username: username,
                    deck: myDeck,
                    graveyard: []
                }
            },
            gameState: {
                gameStage: 'waiting', // Changed from 'preparation' to 'waiting'
                timer: 60,
                currentRound: 0,
                totalRounds: totalRounds
            },
            lastCard: lastCard
        });

        alert(`Room created! Share this Room ID with your opponent: ${newRoomId}`);
    };

    // Function to join an existing game room
    const joinRoom = async () => {
        if (!username) {
            alert('Please enter a username.');
            return;
        }

        if (!roomId) {
            alert('Please enter a valid Room ID.');
            return;
        }

        const roomRef = dbRef(database, `rooms/${roomId}/players/player2`);

        // Check if player2 already exists
        onValue(dbRef(database, `rooms/${roomId}/players/player2`), async (snapshot) => {
            if (snapshot.exists()) {
                alert('Room is already full.');
            } else {
                setPlayerId('player2');
                setIsRoomJoined(true);

                // Add player2 to the room
                await set(roomRef, {
                    username: username,
                    deck: myDeck,
                    graveyard: []
                });

                alert('Successfully joined the room!');
            }
        }, {
            onlyOnce: true
        });
    };

    // Function to update game state in Realtime Database
    const updateGameState = (key, value) => {
        if (roomId) {
            const gameStateRef = dbRef(database, `rooms/${roomId}/gameState`);
            update(gameStateRef, { [key]: value });
        }
    };

    return (
        <div className='background' style={{ backgroundImage: `url(${background})` }}>
            {!isRoomJoined && (
                <div className="lobby">
                    <h2>Welcome to the Battle</h2>
                    <input
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <div className="room-actions">
                        <button onClick={createRoom}>Create Room</button>
                        <input
                            type="text"
                            placeholder="Enter Room ID"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                        />
                        <button onClick={joinRoom}>Join Room</button>
                    </div>
                </div>
            )}

            {isRoomJoined && (
                <>
                    <Timer gameStage={gameStage} timer={timer} currentRound={currentRound} totalRounds={totalRounds} />
                    
                    {gameStage === 'waiting' && (
                        <WaitingForPlayer />
                    )}
                    
                    {gameStage === 'preparation' && (
                        <PreparationStage />
                    )}
                    
                    {gameStage === 'battle' && (
                        <>
                            <Utilities
                                username={username}
                                deck={playerId === 'player1' ? opponentCards : myCards}
                                graveyard={playerId === 'player1' ? [] : []}
                                leftBtn={leftButton}
                                rightBtn={rightButton} // Corrected
                                currentRound={currentRound}
                                totalRounds={totalRounds}
                                roomId={roomId}
                                playerId={playerId}
                            />

                            <div className='mid-row'>
                                <div>
                                    <CardSlots cards={playerId === 'player1' ? opponentCards : myCards} />
                                    <CardSlots cards={playerId === 'player1' ? myCards : opponentCards} />
                                </div>
                                <img className='last-card' src={lastCard} alt="Last Card" />
                            </div>
                        </>
                    )}

                    {gameStage === 'finished' && (
                        <EndStage />
                    )}
                </>
            )}
        </div>
    );
}

// Helper Components Defined Outside the Main Component

function Timer({ gameStage, timer, currentRound, totalRounds }) {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    let stageText = '';
    if (gameStage === 'waiting') {
        stageText = 'Waiting for Opponent...';
    } else if (gameStage === 'preparation') {
        stageText = 'Preparation Stage';
    } else if (gameStage === 'battle') {
        stageText = `Round ${currentRound} of ${totalRounds}`;
    } else if (gameStage === 'finished') {
        stageText = 'Battle Finished';
    }

    return (
        <div className="timer">
            <p>{stageText}</p>
            <p>{formatTime(timer)}</p>
        </div>
    );
}

function Utilities({ username, deck, graveyard, leftBtn, rightBtn, currentRound, totalRounds, roomId, playerId }) {
    const [isGraveyardVisible, setIsGraveyardVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const cardsToShow = 6;
    const blankCard = backCard; // temporary

    const toggleGraveyard = () => setIsGraveyardVisible(!isGraveyardVisible);
    const handleNext = () => setCurrentIndex(prev => Math.min(prev + cardsToShow, deck.length - cardsToShow));
    const handlePrevious = () => setCurrentIndex(prev => Math.max(prev - cardsToShow, 0));

    const visibleCards = deck.slice(currentIndex, currentIndex + cardsToShow);
    const blankCardCount = Math.max(0, cardsToShow - visibleCards.length);

    // Function to handle player actions (e.g., Attack)
    const handleAction = async () => {
        // Implement your game logic here
        console.log(`${username} performed an action in round ${currentRound}`);

        // Example: Update lastCard in the database
        const roomRef = dbRef(database, `rooms/${roomId}`);
        const randomCard = deck[Math.floor(Math.random() * deck.length)];
        await update(roomRef, { lastCard: randomCard });

        // Example: Add card to graveyard
        const graveyardPath = `rooms/${roomId}/players/${playerId}/graveyard`;
        const graveyardRef = dbRef(database, graveyardPath);
        push(graveyardRef, randomCard);

        // Example: Deduct HP or other game mechanics
        // You need to implement the logic based on your game design
    };

    return (
        <>
            {isGraveyardVisible && (
                <div className="graveyard">
                    <button onClick={toggleGraveyard}>Close</button>
                    <h2>{username}'s Graveyard</h2>
                    {graveyard.length === 0 ? (
                        <p>Your graveyard is currently empty.</p>
                    ) : (
                        <div className='graveyardCards'>
                            {graveyard.map((card, index) => (
                                <img className="m-2" key={index} src={card} alt={`Graveyard Card ${index + 1}`} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="row">
                <img onClick={toggleGraveyard} src={graveyardCard} alt="Graveyard" />
                <div className="carousel">
                    <button onClick={handlePrevious} disabled={currentIndex === 0}>
                        <img src={leftBtn} alt="Previous" />
                    </button>

                    <div className="deck">
                        {visibleCards.map((card, index) => (
                            <img key={index} src={card} alt={`Card ${currentIndex + index + 1}`} />
                        ))}
                        {Array.from({ length: blankCardCount }).map((_, index) => (
                            <img key={`blank-${index}`} src={blankCard} alt="Blank Card" />
                        ))}
                    </div>

                    <button onClick={handleNext} disabled={currentIndex + cardsToShow >= deck.length}>
                        <img src={rightBtn} alt="Next" /> {/* Corrected prop */}
                    </button>
                </div>

                <div className="stats">
                    <p>{username}</p>
                    <p>HP: 5000</p>
                    <p>Cards: {deck.length}</p>
                    {currentRound > 0 && <p>Round: {currentRound}</p>}
                </div>
            </div>

            {/* Battle Actions */}
            {currentRound > 0 && currentRound <= totalRounds && (
                <div className="battle-actions">
                    <button onClick={handleAction}>Attack</button>
                    {/* Add more actions as needed */}
                </div>
            )}
        </>
    );
}

function CardSlots({ cards }) {
    return (
        <div className="card-slot my-4">
            {cards.map((card, index) => (
                <img key={index} src={card} alt={`Card ${index + 1}`} />
            ))}
        </div>
    );
}

// Additional Components for Different Stages
function PreparationStage() {
    return (
        <div className="preparation-stage">
            <h2>Preparation Stage</h2>
            <p>Get ready for the battle! You have 1 minute to prepare your strategy.</p>
        </div>
    );
}

function EndStage() {
    return (
        <div className="end-stage">
            <h2>Battle Finished</h2>
            <p>Congratulations! The battle has concluded.</p>
            {/* You can add more details like results, scores, etc. */}
        </div>
    );
}

function WaitingForPlayer() {
    return (
        <div className="waiting-stage">
            <h2>Waiting for Opponent...</h2>
            <p>Share the Room ID with your opponent to start the game.</p>
        </div>
    );
}

export default Battlefield;
