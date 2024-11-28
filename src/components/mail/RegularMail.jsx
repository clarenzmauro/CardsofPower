import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import './MailStyles.css';

const RegularMail = ({ mailContent, mailSender, mailSent, onDelete, deleting }) => {
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
        <div className="mail-item regular-mail">
            <div className="mail-content-wrapper">
                <div className="mail-text">
                    {mailContent}
                </div>
                <div className="mail-info">
                    <span>From: {senderUsername}</span>
                    <span>Sent: {mailSent.toDate().toLocaleString()}</span>
                </div>
            </div>
            <button 
                className="delete-button"
                onClick={onDelete}
                disabled={deleting}
            >
                🗑️
            </button>
        </div>
    );
};

RegularMail.propTypes = {
    mailContent: PropTypes.string.isRequired,
    mailSender: PropTypes.string.isRequired,
    mailSent: PropTypes.object.isRequired,
    onDelete: PropTypes.func.isRequired,
    deleting: PropTypes.bool.isRequired
};

export default RegularMail;
