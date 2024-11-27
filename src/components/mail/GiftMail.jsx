import PropTypes from 'prop-types';

import { useState, useEffect } from 'react';

import { doc, getDoc } from 'firebase/firestore';

import { firestore } from '../firebaseConfig';

import './MailStyles.css';



const GiftMail = ({ mailSender, mailSent, isGifted, onAccept, onReject }) => {

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

        <div className="mail-item gift-mail">

            <div className="mail-content-wrapper">

                <div className="mail-text">

                    {senderUsername} has gifted you the {isGifted.cardName}

                </div>

                <div className="mail-info">

                    <span>Sent: {mailSent.toDate().toLocaleString()}</span>

                </div>

            </div>

            <div className="action-buttons">

                <button className="accept-button" onClick={() => onAccept(isGifted.cardId)}>✓</button>

                <button className="reject-button" onClick={onReject}>✕</button>

            </div>

        </div>

    );

};



GiftMail.propTypes = {

    mailSender: PropTypes.string.isRequired,

    mailSent: PropTypes.object.isRequired,

    isGifted: PropTypes.shape({

        cardId: PropTypes.string.isRequired,

        cardName: PropTypes.string.isRequired,

        isIt: PropTypes.bool.isRequired

    }).isRequired,

    onAccept: PropTypes.func.isRequired,

    onReject: PropTypes.func.isRequired

};



export default GiftMail; 
