import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TransactionsPage = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/transactions', { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success) {
          setTransactions(data.data);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      }
    };

    fetchTransactions();
  }, [user, navigate]);

  return (
    <>
      <Navbar />
      <main className="container">
        <h2>Payment Transaction History</h2>
        <p className="subtitle">Audit trail of completed payment receipts and extensions stored in MongoDB Atlas</p>

        <table id="transactions-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Payment Reference</th>
              <th>Booking ID</th>
              <th>Date & Time</th>
              <th>Facility Name</th>
              <th>Slot</th>
              <th>Amount Paid</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((t) => {
                const dateStr = t.timestamp ? new Date(t.timestamp).toLocaleDateString() : (t.date || 'N/A');
                return (
                  <tr key={t.transactionId || t._id}>
                    <td><strong>{t.transactionId}</strong></td>
                    <td><code style={{ fontSize: '12px' }}>{t.paymentId}</code></td>
                    <td>{t.bookingId}</td>
                    <td>{dateStr}</td>
                    <td>{t.facilityName || 'City Mall Parking'}</td>
                    <td><strong style={{ color: 'var(--primary-blue)' }}>{t.slotId || t.slotNumber || 'A4'}</strong></td>
                    <td><strong>Rs. {t.amount}</strong></td>
                    <td><span style={{ fontSize: '13px' }}>{t.paymentMethod || 'Razorpay'}</span></td>
                    <td><span className="badge badge-success">{t.paymentStatus || t.status || 'SUCCESSFUL'}</span></td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No transaction payment records found in MongoDB Atlas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
      <Footer />
    </>
  );
};

export default TransactionsPage;
