import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, onSnapshot, collection, runTransaction, Timestamp, query, where, getDocs, addDoc, deleteField } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { firestore } from './firebaseConfig';
import './ChatView.css';

const ChatView = ({ friendUsername, currentUserDocId, convoId, onUnfriend }) => {
    const [messageInput, setMessageInput] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportText, setReportText] = useState('');
    const [showGiftOverlay, setShowGiftOverlay] = useState(false);
    const [userCards, setUserCards] = useState([]);
    const [isLoadingCards, setIsLoadingCards] = useState(false);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!convoId) return;

        // First get friend's document ID
        const getFriendId = async () => {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('username', '==', friendUsername));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const friendDocId = querySnapshot.docs[0].id;

                // Listen to both users' documents for friendship status
                const userUnsubscribe = onSnapshot(doc(firestore, 'users', currentUserDocId), (doc) => {
                    if (doc.exists()) {
                        const userData = doc.data();
                        if (!userData.friends || !userData.friends[friendUsername]) {
                            window.location.reload();
                        }
                    }
                });

                const friendUnsubscribe = onSnapshot(doc(firestore, 'users', friendDocId), async (doc) => {
                    if (doc.exists()) {
                        const friendData = doc.data();
                        const currentUserDoc = await getDoc(doc(firestore, 'users', currentUserDocId));
                        const currentUsername = currentUserDoc.data().username;
                        if (!friendData.friends || !friendData.friends[currentUsername]) {
                            window.location.reload();
                        }
                    }
                });

                // Now set up the chat listener with the correct IDs
                const chatDoc = doc(firestore, 'chats', convoId);
                const unsubscribe = onSnapshot(chatDoc, (doc) => {
                    if (doc.exists()) {
                        const chatData = doc.data();
                        const allMessages = [];

                        // Get messages using userDocIds
                        [currentUserDocId, friendDocId].forEach(userId => {
                            if (chatData[userId]) {
                                Object.keys(chatData[userId])
                                    .filter(key => key !== 'counter')
                                    .forEach(chatKey => {
                                        allMessages.push({
                                            ...chatData[userId][chatKey],
                                            sender: userId === currentUserDocId ? 'user' : 'friend',
                                            id: `${userId}_${chatKey}`
                                        });
                                    });
                            }
                        });

                        // Sort messages by timestamp
                        const sortedMessages = allMessages.sort((a, b) => 
                            a.dateSent.toMillis() - b.dateSent.toMillis()
                        );

                        // Get last 10 messages
                        const recentMessages = sortedMessages.slice(-10);
                        setMessages(recentMessages);
                        setLoading(false);
                        scrollToBottom();
                    }
                });

                return () => {
                    userUnsubscribe();
                    friendUnsubscribe();
                    unsubscribe();
                };
            }
        };

        getFriendId();
    }, [convoId, currentUserDocId, friendUsername]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !convoId) return;

        try {
            await runTransaction(firestore, async (transaction) => {
                const chatDoc = await transaction.get(doc(firestore, 'chats', convoId));
                if (!chatDoc.exists()) {
                    throw new Error("Chat document not found");
                }

                const chatData = chatDoc.data();
                const currentCounter = (chatData[currentUserDocId]?.counter || 0) + 1;

                // Update using userDocId instead of username
                transaction.update(doc(firestore, 'chats', convoId), {
                    [`${currentUserDocId}.counter`]: currentCounter,
                    [`${currentUserDocId}.chat${currentCounter}`]: {
                        message: messageInput,
                        dateSent: Timestamp.now()
                    }
                });
            });

            setMessageInput('');
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again.");
        }
    };

    const handleSendGift = async () => {
        setShowGiftOverlay(true);
        setIsLoadingCards(true);
        try{
            const userDoc = await getDoc(doc(firestore, 'users', currentUserDocId));
            if (userDoc.exists() && userDoc.data().inventory) {
                const inventory = userDoc.data().inventory;
                const cardsRef = collection(firestore, 'cards');
                const q = query(cardsRef, where('__name__', 'in', inventory));
                const cardsSnapshot = await getDocs(q);
                
                const storage = getStorage();
                const fetchedCards = await Promise.all(
                    cardsSnapshot.docs.map(async (doc) => {
                        const cardData = doc.data();
                        const imageRef = ref(storage, cardData.imageUrl);
                        const imageUrl = await getDownloadURL(imageRef);
                        return {
                            id: doc.id,
                            ...cardData,
                            imageUrl
                        };
                    })
                );
                setUserCards(fetchedCards);
            }
        } catch (error) {
            console.error("Error fetching cards:", error);
        } finally {
            setIsLoadingCards(false);
        }
    };

    const handleCardSelect = async (card) => {
        if(window.confirm(`Are you sure you want to gift ${card.cardName} to ${friendUsername}?`)){
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('username', '==', friendUsername));
            const querySnapshot = await getDocs(q);

            if(!querySnapshot.empty){
                const friendDocId = querySnapshot.docs[0].id;
            // Send gift mail to receiver
            await addDoc(collection(firestore, 'mail'), {
                isFriendRequest: false,
                isGifted: {
                    cardId: card.id,
                    cardName: card.cardName,
                    isIt: true
                },
                mailContent: `${friendUsername} gifted ${card.cardName}`,
                mailReceiver: friendDocId,
                mailSender: currentUserDocId,
                mailSent: Timestamp.now()
            });

            // Send confirmation mail to sender
            await addDoc(collection(firestore, 'mail'), {
                isFriendRequest: false,
                isGifted: {
                    cardId: "",
                    cardName: "",
                    isIt: false
                },
                mailContent: `You gifted ${card.cardName} to ${friendUsername}`,
                mailReceiver: currentUserDocId,
                mailSender: currentUserDocId,
                mailSent: Timestamp.now()
            });
            setShowGiftOverlay(false);
        }
        } catch (error) {
            console.error("Error sending gift:", error);
        }
    }
    };

    const handleRemoveFriend = async () => {
        if (window.confirm(`Are you sure you want to unfriend ${friendUsername}?`)) {
            try {
                await runTransaction(firestore, async (transaction) => {
                    // Get current user's document
                    const userDoc = await transaction.get(doc(firestore, 'users', currentUserDocId));
                    if (!userDoc.exists()) {
                        throw new Error("User document not found");
                    }
                    const currentUserUsername = userDoc.data().username;

                    // Get friend's document
                    const usersRef = collection(firestore, 'users');
                    const q = query(usersRef, where('username', '==', friendUsername));
                    const querySnapshot = await getDocs(q);

                    if (querySnapshot.empty) {
                        throw new Error("Friend document not found");
                    }
                    const friendDocId = querySnapshot.docs[0].id;

                    // Remove from both users' friends lists
                    transaction.update(doc(firestore, 'users', currentUserDocId), {
                        [`friends.${friendUsername}`]: deleteField()
                    });

                    transaction.update(doc(firestore, 'users', friendDocId), {
                        [`friends.${currentUserUsername}`]: deleteField()
                    });

                    // Delete the chat document
                    transaction.delete(doc(firestore, 'chats', convoId));

                    // Create notification mails for both users
                    const mailRef1 = doc(collection(firestore, 'mail'));
                    const mailRef2 = doc(collection(firestore, 'mail'));

                    transaction.set(mailRef1, {
                        isFriendRequest: false,
                        isGifted: {
                            cardId: "",
                            cardName: "",
                            isIt: false
                        },
                        mailContent: `You unfriended ${friendUsername}`,
                        mailReceiver: currentUserDocId,
                        mailSender: currentUserDocId,
                        mailSent: Timestamp.now()
                    });

                    transaction.set(mailRef2, {
                        isFriendRequest: false,
                        isGifted: {
                            cardId: "",
                            cardName: "",
                            isIt: false
                        },
                        mailContent: `${currentUserUsername} unfriended you`,
                        mailReceiver: friendDocId,
                        mailSender: currentUserDocId,
                        mailSent: Timestamp.now()
                    });
                });

                // Call the callback to update UI
                onUnfriend();
            } catch (error) {
                console.error("Error removing friend:", error);
                alert("Failed to remove friend. Please try again.");
            }
        }
    };

    const handleReport = () => {
        if (reportText.trim().length > 100) {
            alert("Report message cannot exceed 100 characters");
            return;
        }
        // TODO: Handle report submission
        console.log('Report submitted:', reportText);
        setShowReportModal(false);
        setReportText('');
    };

    return (
        <div className="chat-container">
            {/* Header */}
            <div className="chat-header">
                <div className="friend-profile-pic">
                    <div className="profile-circle">
                        <span className="profile-username">prof pic</span>
                    </div>
                </div>
                <div className="friend-name">{friendUsername}</div>
                <div className="options-menu" onClick={() => setShowMenu(!showMenu)}>⋮</div>
                {showMenu && (
                    <div className="menu-dropdown">
                        <button onClick={handleRemoveFriend}>Remove Friend</button>
                        <button onClick={() => setShowReportModal(true)}>Report User</button>
                    </div>
                )}
            </div>

            {/* Updated Messages Area */}
            <div className="messages-area">
                {loading ? (
                    <div>Loading messages...</div>
                ) : messages.length > 0 ? (
                    <>
                        {messages.map(message => (
                            <div 
                                key={message.id}
                                className={`message ${message.sender === 'user' ? 'user-message' : 'friend-message'}`}
                            >
                                <div className="message-content">
                                    {message.message}
                                </div>
                                <div className="message-time">
                                    {message.dateSent.toDate().toLocaleString()}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                ) : (
                    <div>No messages yet. Start the conversation!</div>
                )}
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
                <button className="gift-button" onClick={handleSendGift}>🎁</button>
                <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button className="send-button" onClick={handleSendMessage}>✈️</button>
            </div>

            {showReportModal && (
                <div className="report-modal">
                    <textarea
                        placeholder="File a complaint"
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                        maxLength={100}
                    />
                    <button onClick={handleReport}>Submit</button>
                    <button onClick={() => setShowReportModal(false)}>Cancel</button>
                </div>
            )}
            {showGiftOverlay && (
                <div className="gift-overlay">
                    <button onClick={() => setShowGiftOverlay(false)} style={{color: "white"}}>Close</button>
                    {isLoadingCards ? (
                        <div>Loading your cards...</div>
                    ) : (
                        <div className="cards-grid">
                            {userCards.map(card => (
                                <img
                                    key={card.id}
                                    src={card.imageUrl}
                                    alt={card.cardName}
                                    onClick={() => handleCardSelect(card)}
                                    className="card-image"
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

ChatView.propTypes = {
    friendUsername: PropTypes.string.isRequired,
    currentUserDocId: PropTypes.string.isRequired,
    convoId: PropTypes.string.isRequired,
    onUnfriend: PropTypes.func.isRequired
};

export default ChatView;
