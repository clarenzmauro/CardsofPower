import { useState } from 'react';
import PropTypes from 'prop-types';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from './firebaseConfig';

const ProfilePicModal = ({ isOpen, onClose, userId, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Generate array of profile pic paths
    const profilePics = Array.from({ length: 8 }, (_, i) => `prof_pic${i + 1}.jpg`);

    const handleSelectPicture = async (picFileName) => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const userRef = doc(firestore, 'users', userId);
            await updateDoc(userRef, {
                profPicUrl: picFileName
            });
            
            setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
            onUpdate(picFileName);
            setTimeout(() => onClose(), 1500); // Close modal after showing success message
        } catch (error) {
            console.error('Error updating profile picture:', error);
            setMessage({ type: 'error', text: 'Failed to update profile picture' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Select Profile Picture</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Message Display */}
                {message.text && (
                    <div className={`mb-4 p-2 rounded ${
                        message.type === 'success' ? 'bg-green-100 text-green-700' : 
                        'bg-red-100 text-red-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Grid of Profile Pictures */}
                <div className="grid grid-cols-4 gap-4">
                    {profilePics.map((pic, index) => {
                        const picPath = `/src/assets/profile/${pic}`;
                        return (
                            <button
                                key={index}
                                onClick={() => !loading && handleSelectPicture(pic)}
                                className={`relative aspect-square overflow-hidden rounded-lg 
                                    hover:ring-2 hover:ring-blue-500 transition-all
                                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <img 
                                    src={picPath} 
                                    alt={`Profile ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

ProfilePicModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    userId: PropTypes.string.isRequired,
    onUpdate: PropTypes.func.isRequired
};

export default ProfilePicModal; 
