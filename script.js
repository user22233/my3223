const form = document.getElementById('customer-form');
const customerList = document.getElementById('customer-list');
const searchInput = document.getElementById('search');

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadCustomers();
  document.getElementById('filter-status').addEventListener('change', () => {
    loadCustomers(searchInput.value);
  });
});

// Save customer
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  const amount = form.amount.value.trim();
  const note = form.note.value.trim();
  const date = form.date.value || new Date().toISOString().split('T')[0];
  const due = form.due.value || null;

  if (!name || !amount) {
    alert('Please enter name and amount.');
    return;
  }

  const customer = {
    id: Date.now(),
    name,
    phone,
    amount,
    note,
    date,
    due,
    paid: false
  };

  const data = getData();
  data.push(customer);
  saveData(data);
  form.reset();
  document.getElementById('date').value = new Date().toISOString().split('T')[0];
  loadCustomers();
});

function getData() {
  return JSON.parse(localStorage.getItem('smartCreditData')) || [];
}

function saveData(data) {
  localStorage.setItem('smartCreditData', JSON.stringify(data));
}

function loadCustomers(filter = '') {
  const data = getData();
  updateDisplay(data, filter);
}

function updateDisplay(data, searchTerm = '') {
  const filterStatus = document.getElementById('filter-status')?.value || 'all';
  let filtered = data.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (filterStatus === 'paid') filtered = filtered.filter(c => c.paid);
  else if (filterStatus === 'unpaid') filtered = filtered.filter(c => !c.paid);

  customerList.innerHTML = '';

  filtered.forEach(customer => {
    const card = document.createElement('div');
    card.className = 'customer-card';

    const status = customer.paid ? "✅ Paid" : "🕒 Unpaid";
    const statusClass = customer.paid ? "paid" : "unpaid";

    card.innerHTML = `
  <div class="card-main">
    <div class="card-info">
      <h3>${customer.name}</h3>
      <p>📞 ${customer.phone || 'N/A'}</p>
      <p>💰 ₹${customer.amount}</p>
      <p>📅 Credit Taken: ${customer.date}</p>
      ${customer.due ? `<p>⏰ Due Date: ${customer.due}</p>` : ''}
      ${customer.note ? `<p>📝 ${customer.note}</p>` : ''}
      <p class="${statusClass}">Status: ${status}</p>
    </div>
    <div class="customer-actions">
      ${!customer.paid ? `<button class="mark-paid" onclick="markAsPaid(${customer.id})" title="Mark as Paid">✔️</button>` : ''}
      <button class="whatsapp-btn" onclick="sendReminder('${customer.phone}', '${customer.name}', '${customer.amount}')" title="Send WhatsApp">📲</button>
      <button class="edit-btn" onclick="editCustomer(${customer.id})" title="Edit">✏️</button>
      <button class="delete-btn" onclick="deleteCustomer(${customer.id})" title="Delete">🗑️</button>
    </div>
  </div>
`;



    customerList.appendChild(card);
  });

  const totalPending = data
    .filter(c => !c.paid)
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

  let totalDiv = document.getElementById('total-pending');
  if (!totalDiv) {
    totalDiv = document.createElement('div');
    totalDiv.id = 'total-pending';
    totalDiv.style.marginTop = '20px';
    totalDiv.style.fontWeight = 'bold';
    document.body.appendChild(totalDiv);
  }
  totalDiv.innerText = `Total Pending: ₹${totalPending.toFixed(2)}`;
}

function deleteCustomer(id) {
  if (confirm('Are you sure you want to delete this entry?')) {
    const data = getData().filter(c => c.id !== id);
    saveData(data);
    loadCustomers(searchInput.value);
  }
}

function editCustomer(id) {
  const data = getData();
  const customer = data.find(c => c.id === id);

  if (customer) {
    form.name.value = customer.name;
    form.phone.value = customer.phone;
    form.amount.value = customer.amount;
    form.note.value = customer.note;
    form.date.value = customer.date;
    form.due.value = customer.due || '';
  }
}

function markAsPaid(id) {
  const data = getData();
  const updated = data.map(c => {
    if (c.id === id) c.paid = true;
    return c;
  });
  saveData(updated);
  loadCustomers(searchInput.value);
}

function sendReminder(phone, name, amount) {
  if (!phone) {
    alert('No phone number available for this customer.');
    return;
  }

  const msg = `Dear ${name},\n\nYou have ₹${amount} pending. Please clear it soon.\n\nThank you!`;
  const encodedMsg = encodeURIComponent(msg);
  const waUrl = `https://wa.me/91${phone}?text=${encodedMsg}`;

  // Copy message to clipboard
  navigator.clipboard.writeText(msg).then(() => {
    console.log("📋 Message copied to clipboard.");
  }).catch(() => {
    console.warn("❌ Could not copy to clipboard.");
  });

  // Open WhatsApp link
  window.open(waUrl, '_blank');
}




searchInput.addEventListener('input', () => {
  loadCustomers(searchInput.value);
});

function downloadBackup() {
  const data = localStorage.getItem('smartCreditData') || '[]';
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'SmartCreditManager-Backup.json';
  link.click();
}
function clearPaidEntries() {
  if (confirm("Are you sure you want to delete all paid entries?")) {
    const data = getData().filter(c => !c.paid); // keep only unpaid
    saveData(data);
    loadCustomers(searchInput.value);
    alert("✅ All paid entries have been deleted.");
  }
}


document.getElementById('upload-file').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);
      if (Array.isArray(data)) {
        localStorage.setItem('smartCreditData', JSON.stringify(data));
        alert('✅ Backup restored successfully!');
        loadCustomers();
      } else {
        alert('❌ Invalid backup file.');
      }
    } catch (err) {
      alert('❌ Error reading file.');
    }
  };
  reader.readAsText(file);
});
