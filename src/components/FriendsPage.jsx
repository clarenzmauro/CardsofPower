import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where, doc, deleteDoc, getDoc, addDoc, Timestamp, updateDoc, runTransaction, onSnapshot } from 'firebase/firestore';
import { firestore } from './firebaseConfig';
import RegularMail from './mail/RegularMail';
import GiftMail from './mail/GiftMail';
import FriendRequestMail from './mail/FriendRequestMail';
import UserProfileView from './UserProfileView';
import ChatView from './ChatView';
import './FriendsPage.css';

const FriendsPage = () => {
    const { userDocId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [mails, setMails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [friendsList, setFriendsList] = useState([]);
    const [showMail, setShowMail] = useState(true);
    const [selectedFriendId, setSelectedFriendId] = useState(null);

    useEffect(() => {
        const fetchMails = async () => {
            try {
                const mailsRef = collection(firestore, 'mail');
                const mailsQuery = query(mailsRef, where('mailReceiver', '==', userDocId));
                
                // Set up real-time listener
                const unsubscribe = onSnapshot(mailsQuery, (snapshot) => {
                    const mailsList = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .sort((a, b) => b.mailSent.toMillis() - a.mailSent.toMillis());
                    setMails(mailsList);
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to mails:", error);
                    setLoading(false);
                });

                // Cleanup listener on unmount
                return () => unsubscribe();
            } catch (error) {
                console.error("Error setting up mail listener:", error);
                setLoading(false);
            }
        };

        fetchMails();
    }, [userDocId]);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                // Set up real-time listener for user document
                const userDocRef = doc(firestore, 'users', userDocId);
                const unsubscribe = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists() && doc.data().friends) {
                        const friendsData = doc.data().friends;
                        const friendsList = Object.keys(friendsData).map(username => ({
                            id: username,
                            username: username,
                            convoId: friendsData[username].convoId
                        }));
                        setFriendsList(friendsList);
                    } else {
                        setFriendsList([]);
                    }
                }, (error) => {
                    console.error("Error listening to friends:", error);
                });

                // Cleanup listener on unmount
                return () => unsubscribe();
            } catch (error) {
                console.error("Error setting up friends listener:", error);
            }
        };

        fetchFriends();
    }, [userDocId]);

    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setShowMail(true);
                return;
            }
            try {
                const usersRef = collection(firestore, 'users');
                const q = query(
                    usersRef,
                    where('username', '>=', searchQuery),
                    where('username', '<=', searchQuery + '\uf8ff')
                );
                const querySnapshot = await getDocs(q);
                const results = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        username: doc.data().username
                    }))
                    .filter(user => user.id !== userDocId);
                setSearchResults(results);
            } catch (error) {
                console.error("Error searching users:", error);
            }
        };
        searchUsers();
    }, [searchQuery, userDocId]);

    const handleDelete = async (mailId) => {
        if (!window.confirm('Are you sure you want to delete this mail?')) {
            return;
        }
        setDeleting(true);
        try {
            const mailRef = doc(firestore, 'mail', mailId);
            await deleteDoc(mailRef);
            setMails(prevMails => prevMails.filter(mail => mail.id !== mailId));
        } catch (error) {
            console.error("Error deleting mail:", error);
            alert("Failed to delete mail. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

     const handleFriendRequestAccept = async (mailId) => {
        try {
            const mailDoc = await getDoc(doc(firestore, 'mail', mailId));
            const mailData = mailDoc.data();

            await runTransaction(firestore, async (transaction) => {
                const senderDoc = await transaction.get(doc(firestore, 'users', mailData.mailSender));
                const receiverDoc = await transaction.get(doc(firestore, 'users', userDocId));
                const senderUsername = senderDoc.data().username;
                const receiverUsername = receiverDoc.data().username;

                const chatDocRef = doc(collection(firestore, 'chats'));
                const chatId = chatDocRef.id;

                // Create chat document
                transaction.set(chatDocRef, {
                    [mailData.mailSender]: {
                        counter: 0
                    },
                    [userDocId]: {
                        counter: 0
                    }
                });

                // Update both users' friends lists
                transaction.update(doc(firestore, 'users', mailData.mailSender), {
                    [`friends.${receiverUsername}`]: {
                        convoId: chatId
                    }
                });

                transaction.update(doc(firestore, 'users', userDocId), {
                    [`friends.${senderUsername}`]: {
                        convoId: chatId
                    }
                });

                // Create notification mails
                transaction.set(doc(collection(firestore, 'mail')), {
                    isFriendRequest: false,
                    isGifted: {
                        cardId: "",
                        cardName: "",
                        isIt: false
                    },
                    mailContent: `${receiverUsername} accepted your friend request!`,
                    mailReceiver: mailData.mailSender,
                    mailSender: userDocId,
                    mailSent: Timestamp.now()
                });

                transaction.set(doc(collection(firestore, 'mail')), {
                    isFriendRequest: false,
                    isGifted: {
                        cardId: "",
                        cardName: "",
                        isIt: false
                    },
                    mailContent: `You are now friends with ${senderUsername}!`,
                    mailReceiver: userDocId,
                    mailSender: mailData.mailSender,
                    mailSent: Timestamp.now()
                });

                // Delete the original friend request mail
                transaction.delete(doc(firestore, 'mail', mailId));
            });

            // No need to manually update mails or friends list - onSnapshot listeners will handle it

        } catch (error) {
            console.error("Error accepting friend request:", error);
            alert("Failed to accept friend request. Please try again.");
        }
    };

    const handleFriendRequestReject = async (mailId) => {
        try{
            const mailDoc = await getDoc(doc(firestore, 'mail', mailId));
            const mailData = mailDoc.data();

            const senderDoc = await getDoc(doc(firestore, 'users', mailData.mailSender));
            const receiverDoc = await getDoc(doc(firestore, 'users', userDocId));
            const senderUsername = senderDoc.data().username;
            const receiverUsername = receiverDoc.data().username;

            await addDoc(collection(firestore, 'mail'), {
                isFriendRequest: false,
                isGifted: {
                    cardId: "",
                    cardName: "",
                    isIt: false
                },
                mailContent: `${receiverUsername} discarded your friend request!`,
                mailReceiver: mailData.mailSender,
                mailSender: userDocId,
                mailSent: Timestamp.now()
            });

            await addDoc(collection(firestore, 'mail'), {
                isFriendRequest: false,
                isGifted: {
                    cardId: "",
                    cardName: "",
                    isIt: false
                },
                mailContent: `You have discarded ${senderUsername}'s request!`,
                mailReceiver: userDocId,
                mailSender: mailData.mailSender,
                mailSent: Timestamp.now()
            });

            await deleteDoc(doc(firestore, 'mail', mailId));

            const updatedMailsQuery = query(collection(firestore, 'mail'), where('mailReceiver', '==', userDocId));
            const updatedMailsSnapshot = await getDocs(updatedMailsQuery);
            const updatedMails = updatedMailsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMails(updatedMails);
        }catch (error) {
            console.error("Error rejecting friend request:", error);
            alert("Failed to reject friend request. Please try again.");
        }
    };

    const handleGiftAccept = async (mailId, cardId) => {
        try {
            // Get the mail data first
            const mailDoc = await getDoc(doc(firestore, 'mail', mailId));
            const mailData = mailDoc.data();

            // Start a transaction for all the updates
            await runTransaction(firestore, async (transaction) => {
                // Get sender and receiver docs
                const senderDoc = await transaction.get(doc(firestore, 'users', mailData.mailSender));
                const receiverDoc = await transaction.get(doc(firestore, 'users', userDocId));
                const cardDoc = await transaction.get(doc(firestore, 'cards', cardId));

                if (!senderDoc.exists() || !receiverDoc.exists() || !cardDoc.exists()) {
                    throw new Error("Required documents not found");
                }

                const senderData = senderDoc.data();
                const receiverData = receiverDoc.data();

                // Update sender's inventory and count
                const updatedSenderInventory = senderData.inventory.filter(id => id !== cardId);
                transaction.update(doc(firestore, 'users', mailData.mailSender), {
                    inventory: updatedSenderInventory,
                    currentCardCount: senderData.currentCardCount - 1
                });

                // Update receiver's inventory and counts
                const newReceiverCount = (receiverData.currentCardCount || 0) + 1;
                transaction.update(doc(firestore, 'users', userDocId), {
                    inventory: [...(receiverData.inventory || []), cardId],
                    currentCardCount: newReceiverCount,
                    highestCardCount: Math.max(newReceiverCount, receiverData.highestCardCount || 0)
                });

                // Update card document
                transaction.update(doc(firestore, 'cards', cardId), {
                    boughtFor: 0,
                    'cardLose.local': 0,
                    'cardMatch.local': 0,
                    'cardWin.local': 0,
                    currentOwnerId: userDocId,
                    currentOwnerUsername: receiverData.username,
                    isListed: false,
                    passCount: cardDoc.data().passCount + 1
                });

                // Create notification mails
                transaction.set(doc(collection(firestore, 'mail')), {
                    isFriendRequest: false,
                    isGifted: {
                        cardId: "",
                        cardName: "",
                        isIt: false
                    },
                    mailContent: `${receiverData.username} accepted your gift!`,
                    mailReceiver: mailData.mailSender,
                    mailSender: userDocId,
                    mailSent: Timestamp.now()
                });

                transaction.set(doc(collection(firestore, 'mail')), {
                    isFriendRequest: false,
                    isGifted: {
                        cardId: "",
                        cardName: "",
                        isIt: false
                    },
                    mailContent: `You accepted ${senderData.username}'s gift!`,
                    mailReceiver: userDocId,
                    mailSender: mailData.mailSender,
                    mailSent: Timestamp.now()
                });

                // Delete the gift mail
                transaction.delete(doc(firestore, 'mail', mailId));
            });

            // Update the mails list in the UI
            const updatedMailsQuery = query(collection(firestore, 'mail'), where('mailReceiver', '==', userDocId));
            const updatedMailsSnapshot = await getDocs(updatedMailsQuery);
            const updatedMails = updatedMailsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMails(updatedMails);

        } catch (error) {
            console.error("Error accepting gift:", error);
            alert("Failed to accept gift. Please try again.");
        }
    };

    const handleGiftReject = async (mailId) => {
        try {
            // Get the mail data first
            const mailDoc = await getDoc(doc(firestore, 'mail', mailId));
            const mailData = mailDoc.data();
            
            // Start a transaction for all the updates
            await runTransaction(firestore, async (transaction) => {
                // Get sender and receiver docs
                const senderDoc = await transaction.get(doc(firestore, 'users', mailData.mailSender));
                const receiverDoc = await transaction.get(doc(firestore, 'users', userDocId));

                if (!senderDoc.exists() || !receiverDoc.exists()) {
                    throw new Error("Required documents not found");
                }

                const senderData = senderDoc.data();
                const receiverData = receiverDoc.data();

                // Set the card's isListed back to false
                transaction.update(doc(firestore, 'cards', mailData.isGifted.cardId), {
                    isListed: false
                });

                // Create notification mails
                transaction.set(doc(collection(firestore, 'mail')), {
                    isFriendRequest: false,
                    isGifted: {
                        cardId: "",
                        cardName: "",
                        isIt: false
                    },
                    mailContent: `${receiverData.username} rejected your gift!`,
                    mailReceiver: mailData.mailSender,
                    mailSender: userDocId,
                    mailSent: Timestamp.now()
                });

                transaction.set(doc(collection(firestore, 'mail')), {
                    isFriendRequest: false,
                    isGifted: {
                        cardId: "",
                        cardName: "",
                        isIt: false
                    },
                    mailContent: `You rejected ${senderData.username}'s gift!`,
                    mailReceiver: userDocId,
                    mailSender: mailData.mailSender,
                    mailSent: Timestamp.now()
                });

                // Delete the gift mail
                transaction.delete(doc(firestore, 'mail', mailId));
            });

            // Update the mails list in UI
            const updatedMailsQuery = query(collection(firestore, 'mail'), where('mailReceiver', '==', userDocId));
            const updatedMailsSnapshot = await getDocs(updatedMailsQuery);
            const updatedMails = updatedMailsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMails(updatedMails);

        } catch (error) {
            console.error("Error rejecting gift:", error);
            alert("Failed to reject gift. Please try again.");
        }
    };

    const renderMail = (mail) => {
        if (mail.isFriendRequest) {
            return (
                <FriendRequestMail
                    key={mail.id}
                    mailSender={mail.mailSender}
                    mailSent={mail.mailSent}
                    onAccept={() => handleFriendRequestAccept(mail.id)}
                    onReject={() => handleFriendRequestReject(mail.id)}
                />
            );
        }

        if (mail.isGifted?.isIt) {
            return (
                <GiftMail
                    key={mail.id}
                    mailSender={mail.mailSender}
                    mailSent={mail.mailSent}
                    isGifted={mail.isGifted}
                    onAccept={() => handleGiftAccept(mail.id, mail.isGifted.cardId)}
                    onReject={() => handleGiftReject(mail.id)}
                />
            );
        }

        return (
            <RegularMail
                key={mail.id}
                mailContent={mail.mailContent}
                mailSender={mail.mailSender}
                mailSent={mail.mailSent}
                onDelete={() => handleDelete(mail.id)}
                deleting={deleting}
            />
        );
    };

    const handleUserClick = (userId, username) => {
        setSelectedUser({ id: userId, username });
        setSelectedFriendId(userId);
        setShowMail(false);

        const isFriend = friendsList.some(friend => friend.username === username);
        if (isFriend) {
            const friend = friendsList.find(friend => friend.username === username);
            setSelectedUser({
                id: userId,
                username: username,
                isFriend: true,
                convoId: friend.convoId
            });
        }
    };

    const renderUserList = () => {
        const usersToDisplay = searchQuery.trim() ? searchResults : friendsList;

        return usersToDisplay.map(user => (
            <div 
                key={user.id}
                className={`friend-search-result ${user.id === selectedFriendId ? 'selected' : ''}`}
                onClick={() => handleUserClick(user.id, user.username)}
                style={{ cursor: 'pointer' }}
            >
                {user.username}
            </div>
        ));
    };

    const handleMailButtonClick = () => {
        setShowMail(true);
        setSelectedUser(null);
    };

    return (
        <div className="friends-page-container">
            <div className="friends-sidebar">
                <button 
                    className="sidebar-header-button"
                    onClick={handleMailButtonClick}
                >
                    <div className="button-container">
            <img 
                src="/src/assets/images/mail_catalog.png" 
                alt="Mail" 
                            className="mail-catalog-image"
                            />
                        <span className="button-text">Mail</span>
                    </div>
                </button>
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="search-results">
                    {renderUserList()}
                </div>
            </div>
            <div className="main-content">
                {selectedUser && !showMail ? (
                    selectedUser.isFriend ? (
                        <ChatView 
                            friendUsername={selectedUser.username}
                            currentUserDocId={userDocId}
                            convoId={selectedUser.convoId}
                            onUnfriend={() => {
                                setShowMail(true);
                                setSelectedUser(null);
                            }}
                        />
                    ) : (
                        <UserProfileView
                            username={selectedUser.username}
                            userId={selectedUser.id}
                            currentUserDocId={userDocId}
                        />
                    )
                ) : (
                <div className="mail-content">
                    <div className="mail-list">
                        {loading ? (
                            <div>Loading mails...</div>
                        ) : mails.length > 0 ? (
                            mails.map(mail => renderMail(mail))
                        ) : (
                            "No mail for you right now"
                        )}
                    </div>
                </div>
                )}
            </div>
        </div>
    );
};

export default FriendsPage;
