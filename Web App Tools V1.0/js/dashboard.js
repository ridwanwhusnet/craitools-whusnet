// ========== Utility Functions ==========
const $ = id => document.getElementById(id);
const hide = el => el?.classList.add('hidden');
const show = el => el?.classList.remove('hidden');
const toggle = el => el?.classList.toggle('hidden');

// ========== Auth & Logout ==========
function logout() {
  localStorage.removeItem('user');
  window.location.href = `index.html?ts=${Date.now()}`;
}

// ========== Chat Popup Mobile ==========
function toggleChatPopup() {
  show($('mobileChatModal'));
  loadChatHistory('mobile');
  setTimeout(() => $('mobileMessages')?.scrollTo(0, $('mobileMessages').scrollHeight), 200);
}

function leaveMobileChat() {
  hide($('mobileChatModal'));
  localStorage.removeItem('chatHistory');
}

// ========== Chatbox Desktop ==========
function startChat() {
  const chatBox = $('chatBox');
  const startBtn = $('startChatBtn');
  if (chatBox && startBtn) {
    show(chatBox);
    hide(startBtn);
    setTimeout(() => chatBox.scrollTo(0, chatBox.scrollHeight), 100);
  }
  loadChatHistory('desktop');
}

function leaveChat() {
  const chatBox = $('chatBox');
  const startBtn = $('startChatBtn');
  if (chatBox && startBtn) {
    hide(chatBox);
    show(startBtn);
  }
  localStorage.removeItem('chatHistory');
}

// ========== Chat History Utilities ==========
function saveToHistory(sender, text) {
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  history.push({ sender, text });
  localStorage.setItem('chatHistory', JSON.stringify(history));
}

function createMessageBubble(text, sender) {
  const wrapper = document.createElement('div');
  wrapper.className = `w-full flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
  
  const bubble = document.createElement('div');
  bubble.className = `typing-bubble${sender === 'bot' ? ' bot' : ''}`;
  bubble.textContent = text;
  
  wrapper.appendChild(bubble);
  return wrapper;
}

function loadChatHistory(mode = 'desktop') {
  const messagesEl = $(mode === 'mobile' ? 'mobileMessages' : 'messages');
  if (!messagesEl) return;
  
  messagesEl.innerHTML = '';
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  
  history.forEach(entry => {
    messagesEl.appendChild(createMessageBubble(entry.text, entry.sender));
  });
  
  messagesEl.scrollTo(0, messagesEl.scrollHeight);
}

// ========== Message Sending Functions ==========
async function sendMessageToAPI(message) {
  const email = localStorage.getItem('user') || 'anonymous@guest.local';
  const username = email.split('@')[0] || 'guest';
  
  try {
    const response = await fetch('https://n8n.connexa.net.id/webhook/a99ad47e-e49b-4890-8f9d-e7a9f3d941c1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, email, username })
    });
    
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = {}; }
    
    if (Array.isArray(data) && data[0]?.output) return data[0].output;
    if (data.output) return data.output;
    if (data.reply) return data.reply;
    return 'Maaf, saya belum paham, coba pertanyaan lain.';
  } catch {
    return 'Ajax sedang offline, coba lagi nanti ya!';
  }
}

async function sendMessage(mode = 'desktop') {
  const input = $(mode === 'mobile' ? 'mobileUserInput' : 'userInput');
  const message = input.value.trim();
  if (!message) return;
  
  const messagesEl = $(mode === 'mobile' ? 'mobileMessages' : 'messages');
  messagesEl.appendChild(createMessageBubble(message, 'user'));
  input.value = '';
  messagesEl.scrollTo(0, messagesEl.scrollHeight);
  saveToHistory('user', message);
  
  const response = await sendMessageToAPI(message);
  messagesEl.appendChild(createMessageBubble(response, 'bot'));
  messagesEl.scrollTo(0, messagesEl.scrollHeight);
  saveToHistory('bot', response);
}

// ========== Event Listeners ==========
function setupEventListeners() {
  const addEnterListener = (input, mode) => {
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(mode);
      }
    });
  };

  addEnterListener($('userInput'), 'desktop');
  addEnterListener($('mobileUserInput'), 'mobile');
}

// ========== Sidebar Functions ==========
function setupSidebar() {
  const button = $('hamburgerBtn');
  const sidebar = $('sidebar');

  // Desktop hover behavior
  button?.addEventListener('mouseenter', () => {
    if (window.innerWidth >= 768) {
      show(sidebar);
      sidebar.classList.add('sidebar-animate');
      hide(button);
    }
  });

  sidebar?.addEventListener('mouseleave', () => {
    if (window.innerWidth >= 768) {
      hide(sidebar);
      sidebar.classList.remove('sidebar-animate');
      show(button);
    }
  });

  // Mobile tap behavior
  button?.addEventListener('click', () => {
    if (window.innerWidth < 768) {
      show(sidebar);
      sidebar.classList.add('sidebar-animate');
      hide(button);
    }
  });

  sidebar?.addEventListener('click', e => {
    if (window.innerWidth < 768) {
      hide(sidebar);
      sidebar.classList.remove('sidebar-animate');
      show(button);
    }
  });
}

function closeSidebar() {
  hide($('sidebar'));
  show($('hamburgerBtn'));
}

// ========== Modal Functions ==========
function toggleChangelog() {
  toggle($('changelogModal'));
}

function toggleHelp() {
  toggle($('helpModal'));
}

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
  // Splash screen handler
  setTimeout(() => {
    hide($('splash'));
    show($('main-content'));
  }, 1200);

  // Auth check
  if (!localStorage.getItem('user')) {
    window.location.href = 'index.html';
    return;
  }

  // Greeting
  const user = localStorage.getItem('user');
  if (user) {
    const greetingEl = $('greeting');
    if (greetingEl) greetingEl.textContent = `Hi! ${user.split('@')[0]}!`;
  }

  // Setup components
  setupEventListeners();
  setupSidebar();
  loadChatHistory(window.innerWidth <= 768 ? 'mobile' : 'desktop');

  // Back button prevention
  window.addEventListener('pageshow', event => {
    if ((event.persisted || (window.performance?.navigation?.type === 2)) && !localStorage.getItem('user')) {
      window.location.href = 'index.html';
    }
  });
});