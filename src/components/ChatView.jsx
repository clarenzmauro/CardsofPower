import PropTypes from 'prop-types';

import { useState, useEffect } from 'react';

import './ChatView.css';

import { doc, updateDoc, deleteField, addDoc, collection, Timestamp, getDocs, query, where, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { firestore } from './firebaseConfig';



const ChatView = ({ friendUsername, currentUserDocId }) => {

    const [messageInput, setMessageInput] = useState('');

    const [showMenu, setShowMenu] = useState(false);

    const [showReportModal, setShowReportModal] = useState(false);

    const [reportText, setReportText] = useState('');
    const [showGiftOverlay, setShowGiftOverlay] = useState(false);
    const [userCards, setUserCards] = useState([]);
    const [isLoadingCards, setIsLoadingCards] = useState(false);


    const handleSendMessage = () => {

        // TODO: Implement message sending

        console.log('Sending message:', messageInput);

        setMessageInput('');

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

                // Remove from both users' friends lists

                const userRef = doc(firestore, 'users', currentUserDocId);

                const friendRef = doc(firestore, 'users', friendUsername);



                await updateDoc(userRef, {

                    [`friends.${friendUsername}`]: deleteField()

                });



                await updateDoc(friendRef, {

                    [`friends.${currentUserUsername}`]: deleteField()

                });



                // Send notification mails

                await addDoc(collection(firestore, 'mail'), {

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



                await addDoc(collection(firestore, 'mail'), {

                    isFriendRequest: false,

                    isGifted: {

                        cardId: "",

                        cardName: "",

                        isIt: false

                    },

                    mailContent: `${currentUserUsername} unfriended you`,

                    mailReceiver: friendUsername,

                    mailSender: currentUserDocId,

                    mailSent: Timestamp.now()

                });

            } catch (error) {

                console.error("Error removing friend:", error);

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



            {/* Messages Area */}

            <div className="messages-area">

                {/* Example messages */}

                <div className="message friend-message">

                    <div className="message-content">Message From Friend</div>

                    <div className="message-time">Date and Time sent</div>

                </div>



                <div className="message user-message">

                    <div className="message-content">Message From User</div>

                    <div className="message-time">Date and Time sent</div>

                </div>

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
                    <button onClick={() => setShowGiftOverlay(false)}>Close</button>
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

    currentUserDocId: PropTypes.string.isRequired

};



export default ChatView;
