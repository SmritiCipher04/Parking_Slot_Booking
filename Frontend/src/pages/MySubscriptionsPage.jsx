import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MySubscriptionsPage = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSubscriptions = async () => {
      try {
        const res = await fetch('/api/subscriptions/my-subscriptions', {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setSubscriptions(data.data);
        }
      } catch (err) {
        console.error('Error fetching user subscriptions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user, navigate]);

  const calculateDaysRemaining = (endDateStr) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <>
      <Navbar />
      <main className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2>My ExcuseME PLUS Passes</h2>
            <p className="subtitle" style={{ margin: 0 }}>View active and past subscription passes for unlimited parking access</p>
          </div>
          <Link to="/excuseme-plus" className="btn">
            💳 Get New ExcuseME PLUS Pass
          </Link>
        </div>

        <table id="subscriptions-table">
          <thead>
            <tr>
              <th>Pass Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Valid From</th>
              <th>Valid Until</th>
              <th>Days Remaining</th>
              <th>Amount Paid</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length > 0 ? (
              subscriptions.map((sub) => {
                const subId = sub._id || sub.id;
                const daysRemaining = calculateDaysRemaining(sub.endDate);
                const isExpired = sub.status === 'expired' || daysRemaining === 0;
                const badgeClass = isExpired ? 'badge-danger' : 'badge-success';
                const statusLabel = isExpired ? 'Expired' : 'Active Pass';

                return (
                  <tr key={subId}>
                    <td><strong>{sub.planName}</strong></td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                        {sub.planType}
                      </span>
                    </td>
                    <td>{sub.locationName}</td>
                    <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                    <td>{new Date(sub.endDate).toLocaleDateString()}</td>
                    <td>
                      {isExpired ? (
                        <span style={{ color: 'var(--text-secondary)' }}>0 days</span>
                      ) : (
                        <strong style={{ color: 'var(--primary-blue)' }}>{daysRemaining} days remaining</strong>
                      )}
                    </td>
                    <td><strong>Rs. {sub.pricePaid}</strong></td>
                    <td><span className={`badge ${badgeClass}`}>{statusLabel}</span></td>
                    <td>
                      {!isExpired ? (
                        <Link to="/slots" className="btn btn-sm">
                          🚗 Book Slot (Rs. 0)
                        </Link>
                      ) : (
                        <Link to="/excuseme-plus" className="btn btn-sm btn-secondary">
                          🔄 Renew Pass
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {loading ? 'Loading passes...' : (
                    <>
                      You don't have any active ExcuseME PLUS passes. <Link to="/excuseme-plus">Get ExcuseME PLUS now</Link>
                    </>
                  )}
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

export default MySubscriptionsPage;
