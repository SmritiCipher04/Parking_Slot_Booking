/**
 * Transaction History Page Controller
 * Reads and renders user payment transaction history directly from MongoDB Atlas.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Gate page to logged-in users only
  const user = Auth.requireAuth();
  if (!user) return;

  const tableBody = document.querySelector('#transactions-table tbody');
  if (!tableBody) return;

  const transactions = await Storage.getTransactions(user.email);
  tableBody.innerHTML = '';

  if (transactions.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--text-secondary);">No transaction payment records found in MongoDB Atlas.</td></tr>`;
    return;
  }

  transactions.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.transactionId}</strong></td>
      <td><code style="font-size:12px;">${t.paymentId}</code></td>
      <td>${t.bookingId}</td>
      <td>${t.date}</td>
      <td>${t.facilityName}</td>
      <td><strong style="color: var(--primary-blue);">${t.slotId}</strong></td>
      <td><strong>Rs. ${t.amount}</strong></td>
      <td><span style="font-size:13px;">${t.paymentMethod || 'Razorpay'}</span></td>
      <td><span class="badge badge-success">${t.status || 'SUCCESSFUL'}</span></td>
    `;
    tableBody.appendChild(tr);
  });
});
