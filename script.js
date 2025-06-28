const BASE_URL = 'http://localhost:5050';

const form = document.getElementById('sessionForm');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const emailInput = document.getElementById('email');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const editId = document.getElementById('editId');
const sessionsList = document.getElementById('sessionsList');
const messageDiv = document.getElementById('message');
const sessionCount = document.getElementById('sessionCount');
const searchInput = document.getElementById('searchInput');

window.onload = () => {
  loadSessions();
};

form.onsubmit = async (e) => {
  e.preventDefault();
  const session = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    email: emailInput.value.trim(),
    category: categoryInput.value,
    date: dateInput.value
  };

  if (!session.title || !session.email || !session.date) {
    showMessage('Please fill in all required fields.', 'danger');
    return;
  }

  try {
    const res = await fetch(
      editId.value ? `${BASE_URL}/sessions/${editId.value}` : `${BASE_URL}/sessions`,
      {
        method: editId.value ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session)
      }
    );
    if (res.ok) {
      showMessage(editId.value ? '✅ Session updated!' : '✅ Session added!', 'success');
      form.reset();
      editId.value = '';
      loadSessions();

      const utterance = new SpeechSynthesisUtterance("Session added successfully. You will receive a reminder email by 8 A.M. in the morning.");
      utterance.lang = 'en-US';
      const voices = speechSynthesis.getVoices();
      utterance.voice = voices.find(v =>
        v.lang === 'en-US' && (v.name.includes("Female") || v.name.includes("Google"))
      ) || voices[0];
      speechSynthesis.speak(utterance);
    } else {
      showMessage('❌ Error saving session.', 'danger');
    }
  } catch (err) {
    console.error(err);
    showMessage('❌ Server error.', 'danger');
  }
};

async function loadSessions() {
  try {
    const res = await fetch(`${BASE_URL}/sessions`);
    const sessions = await res.json();
    localStorage.setItem('focusSessions', JSON.stringify(sessions));
    renderSessions(sessions);
  } catch (err) {
    console.error(err);
    sessionsList.innerHTML = '<li class="list-group-item text-danger">Error loading sessions.</li>';
  }
}

function renderSessions(sessions) {
  sessionsList.innerHTML = '';
  sessionCount.textContent = sessions.length;
  const filter = searchInput.value.toLowerCase();
  const filtered = sessions.filter(s => s.title.toLowerCase().includes(filter));

  if (filtered.length === 0) {
    sessionsList.innerHTML = '<li class="list-group-item">No sessions found.</li>';
    return;
  }

  filtered.forEach(s => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center fade show';
    li.innerHTML = `
      <span>
        <strong>${s.title}</strong> (${s.category}) — ${s.description}
        <small class="text-muted">on ${s.date} (${s.email})</small>
      </span>
      <div>
        <button class="btn btn-sm btn-warning me-2" onclick="editSession(${s.id})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteSession(${s.id})">🗑️</button>
      </div>
    `;
    sessionsList.appendChild(li);
  });
}

async function deleteSession(id) {
  if (!confirm('Are you sure you want to delete this session?')) return;
  try {
    const res = await fetch(`${BASE_URL}/sessions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showMessage('🗑️ Session deleted.', 'success');
      loadSessions();
    } else {
      showMessage('❌ Failed to delete.', 'danger');
    }
  } catch (err) {
    console.error(err);
    showMessage('❌ Server error.', 'danger');
  }
}

function editSession(id) {
  const sessions = JSON.parse(localStorage.getItem('focusSessions')) || [];
  const session = sessions.find(s => s.id === id);
  if (!session) return;

  editId.value = session.id;
  titleInput.value = session.title;
  descriptionInput.value = session.description;
  emailInput.value = session.email;
  categoryInput.value = session.category;
  dateInput.value = session.date;

  titleInput.focus();
}

function showMessage(msg, type) {
  messageDiv.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

searchInput?.addEventListener('input', loadSessions);
