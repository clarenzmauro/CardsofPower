import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { firestore } from './firebaseConfig';
import './ReportsEntries.css';

function ReportsEntries() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsCollection = collection(firestore, 'report');
        const reportsSnapshot = await getDocs(reportsCollection);
        const reportsData = reportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(reportsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleReply = (report) => {
    setSelectedReport(report);
    setShowReplyModal(true);
  };

  const handleResolve = async (reportId) => {
    if (window.confirm('Are you sure you want to resolve this report?')) {
      try {
        // Delete the report document
        await deleteDoc(doc(firestore, 'report', reportId));
        
        // Update local state to remove the resolved report
        setReports(prevReports => prevReports.filter(report => report.id !== reportId));
        alert('Report resolved successfully');
      } catch (error) {
        console.error("Error resolving report:", error);
        alert("Failed to resolve report. Please try again.");
      }
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    try {
      // Send reply as regular mail
      await addDoc(collection(firestore, 'mail'), {
        mailContent: replyText,
        mailReceiver: selectedReport.reportSender,
        mailSender: "SYSTEM",
        mailSent: Timestamp.now(),
        isFriendRequest: false,
        isGifted: {
          cardId: "",
          cardName: "",
          isIt: false
        }
      });

      // Clear and close modal
      setReplyText('');
      setShowReplyModal(false);
      setSelectedReport(null);
      alert('Reply sent successfully');
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply. Please try again.");
    }
  };

  if (loading) {
    return <div>Loading reports...</div>;
  }

  return (
    <div className="reports-entries">
      {reports.map((report) => (
        <div key={report.id} className="report-card">
          <div className="report-header">
            <span className="report-from">From: {report.reportSender}</span>
            <span className="report-against">Against: {report.reportReceiver}</span>
          </div>
          <div className="report-content">
            {report.reportContent}
          </div>
          <div className="report-actions">
            <button 
              className="reply-button"
              onClick={() => handleReply(report)}
            >
              Reply
            </button>
            <button 
              className="resolve-button"
              onClick={() => handleResolve(report.id)}
            >
              Resolve
            </button>
          </div>
        </div>
      ))}

      {showReplyModal && (
        <div className="reply-modal">
          <div className="reply-modal-content">
            <h3>Reply to Report</h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              rows="4"
            />
            <div className="reply-modal-buttons">
              <button onClick={handleSendReply}>Send</button>
              <button onClick={() => {
                setShowReplyModal(false);
                setReplyText('');
                setSelectedReport(null);
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsEntries; 
