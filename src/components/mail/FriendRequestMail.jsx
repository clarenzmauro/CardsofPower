import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import './MailStyles.css';

const FriendRequestMail = ({ mailSender, mailSent, onAccept, onReject }) => {
    const [senderUsername, setSenderUsername] = useState('');

    useEffect(() => {
        const fetchSenderUsername = async () => {
            try {
                const senderDoc = await getDoc(doc(firestore, 'users', mailSender));
                if (senderDoc.exists()) {
                    setSenderUsername(senderDoc.data().username);
                }
            } catch (error) {
                console.error("Error fetching sender username:", error);
            }
        };

        fetchSenderUsername();
    }, [mailSender]);

    return (
        <div className="mail-item friend-request-mail">
            <div className="mail-content-wrapper">
                <div className="mail-text">
                    {senderUsername} has sent you a friend request!
                </div>
                <div className="mail-info">
                    <span>Sent: {mailSent.toDate().toLocaleString()}</span>
                </div>
            </div>
            <div className="action-buttons">
                <button className="accept-button" onClick={onAccept}>✓</button>
                <button className="reject-button" onClick={onReject}>✕</button>
            </div>
        </div>
    );
};

FriendRequestMail.propTypes = {
    mailSender: PropTypes.string.isRequired,
    mailSent: PropTypes.object.isRequired,
    onAccept: PropTypes.func.isRequired,
    onReject: PropTypes.func.isRequired
};

export default FriendRequestMail; 
