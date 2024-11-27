import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where, doc, deleteDoc, getDoc, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
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

    useEffect(() => {
        const fetchMails = async () => {
            try {
                const mailsRef = collection(firestore, 'mail');
                const mailsQuery = query(mailsRef, where('mailReceiver', '==', userDocId));
                const mailsSnapshot = await getDocs(mailsQuery);
                const mailsList = mailsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMails(mailsList);
            } catch (error) {
                console.error("Error fetching mails:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMails();
    }, [userDocId]);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const userDoc = await getDoc(doc(firestore, 'users', userDocId));
                if (userDoc.exists() && userDoc.data().friends) {
                    const friendsData = userDoc.data().friends;
                    const friendsList = Object.keys(friendsData).map(username => ({
                        id: username,
                        username: username,
                        convoId: friendsData[username].convoId
                    }));
                    setFriendsList(friendsList);
                }
            } catch (error) {
                console.error("Error fetching friends:", error);
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
        try{
            const mailDoc = await getDoc(doc(firestore, 'mail', mailId));
            const mailData = mailDoc.data();

            const senderDoc = await getDoc(doc(firestore, 'users', mailData.mailSender));
            const receiverDoc = await getDoc(doc(firestore, 'users', userDocId));
            const senderUsername = senderDoc.data().username;
            const receiverUsername = receiverDoc.data().username;

            const senderRef = doc(firestore, 'users', mailData.mailSender);
            const receiverRef = doc(firestore, 'users', userDocId);

            await updateDoc(receiverRef, {
                [`friends.${senderUsername}`]: {
                    convoId: "TestId"
                }
            });

            await updateDoc(senderRef, {
                [`friends.${receiverUsername}`]: {
                    convoId: "TestId"
                }
            });

            await addDoc(collection(firestore, 'mail'), {
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

            await addDoc(collection(firestore, 'mail'), {
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

            await deleteDoc(doc(firestore, 'mail', mailId));

            const updatedMailsQuery = query(collection(firestore, 'mail'), where('mailReceiver', '==', userDocId));
            const updatedMailsSnapshot = await getDocs(updatedMailsQuery);
            const updatedMails = updatedMailsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMails(updatedMails);
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
        // Handle gift acceptance
        console.log('Gift accepted:', mailId, cardId);
    };

    const handleGiftReject = async (mailId) => {
        // Handle gift rejection
        console.log('Gift rejected:', mailId);
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
                className="friend-search-result"
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
                    Mail
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
                            convoId={selectedUser.convoId}
                            currentUserDocId={userDocId} 
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
