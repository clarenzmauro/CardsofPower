import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { firestore } from './firebaseConfig';
import './UserProfileView.css';

const UserProfileView = ({ username, userId, currentUserDocId }) => {
    const [isPending, setIsPending] = useState(false);
    const [notification, setNotification] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Check if there's already a pending friend request
    useEffect(() => {
        const checkPendingRequest = async () => {
            try {
                const mailRef = collection(firestore, 'mail');
                const q = query(
                    mailRef,
                    where('mailSender', '==', currentUserDocId),
                    where('mailReceiver', '==', userId),
                    where('isFriendRequest', '==', true)
                );

                const querySnapshot = await getDocs(q);
                setIsPending(!querySnapshot.empty);
            } catch (error) {
                console.error("Error checking pending request:", error);
            }
        };

        checkPendingRequest();
    }, [currentUserDocId, userId]);

    const handleAddFriend = async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const mailRef = collection(firestore, 'mail');
            const checkQuery = query(
                mailRef,
                where('mailSender', '==', currentUserDocId),
                where('mailReceiver', '==', userId),
                where('isFriendRequest', '==', true)
            );
            const existingRequests = await getDocs(checkQuery);

            if (!existingRequests.empty) {
                setIsPending(true);
                setNotification('Friend request already sent!');
                return;
            }

            // First, get the receiver's document ID using their username

            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const receiverDocId = querySnapshot.docs[0].id;

                // Create new mail document for friend request

                await addDoc(collection(firestore, 'mail'), {
                    isFriendRequest: true,
                    isGifted: {
                        cardId: "",
                        cardName: "",
                        isIt: false
                    },
                    mailContent: "",
                    mailReceiver: receiverDocId,  // Use the found document ID
                    mailSender: currentUserDocId, // Use the current user's document ID
                    mailSent: Timestamp.now()
                });

                setIsPending(true);
                setNotification('Friend request sent! Awaiting response!');
            } else {
                throw new Error('User not found');
            }
        } catch (error) {
            console.error("Error sending friend request:", error);
            setNotification('Failed to send friend request. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="user-profile-view">
            <div className="profile-pic-container">
                <div className="profile-pic">Profile Pic</div>
            </div>

            <div className="username">{username}</div>

            <button 
                className="add-friend-button"
                onClick={handleAddFriend}
                disabled={isPending || isProcessing}
            >
                {isProcessing ? 'Sending...' : isPending ? 'Request Pending' : 'Add Friend'}
            </button>

            {notification && (
                <div className="notification">
                    {notification}
                </div>
            )}
        </div>
    );
};

UserProfileView.propTypes = {
    username: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    currentUserDocId: PropTypes.string.isRequired
};

export default UserProfileView;
