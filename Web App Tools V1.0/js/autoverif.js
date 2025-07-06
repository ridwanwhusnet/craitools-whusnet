// ========== Utility Functions ==========
const getElement = id => document.getElementById(id);
const hideElement = el => el?.classList.add('hidden');
const showElement = el => el?.classList.remove('hidden');
const toggleElement = el => el?.classList.toggle('hidden');

// ========== Auth & User Management ==========
function logout() {
  localStorage.removeItem('user');
  window.location.href = `index.html?ts=${Date.now()}`;
}

function checkAuth() {
  if (!localStorage.getItem('user')) window.location.href = 'index.html';
}

// ========== Chat Functions ==========
function initializeChat() {
  const user = localStorage.getItem('user');
  if (user) {
    const greetingEl = getElement('greeting');
    if (greetingEl) greetingEl.textContent = `Hi! ${user.split('@')[0]}!`;
  }
  
  loadChatHistory(window.innerWidth <= 768 ? 'mobile' : 'desktop');
  setupEventListeners();
}

function setupEventListeners() {
  const addEnterListener = (input, mode) => {
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(mode);
      }
    });
  };

  addEnterListener(getElement('userInput'), 'desktop');
  addEnterListener(getElement('mobileUserInput'), 'mobile');
}

function createMessageBubble(text, sender) {
  const wrapper = document.createElement('div');
  wrapper.className = `w-full flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
  
  const bubble = document.createElement('div');
  bubble.className = `typing-bubble ${sender === 'bot' ? 'bot' : ''}`;
  bubble.textContent = text;
  
  wrapper.appendChild(bubble);
  return wrapper;
}

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
  const input = getElement(mode === 'mobile' ? 'mobileUserInput' : 'userInput');
  const message = input.value.trim();
  if (!message) return;
  
  const messagesEl = getElement(mode === 'mobile' ? 'mobileMessages' : 'messages');
  messagesEl.appendChild(createMessageBubble(message, 'user'));
  input.value = '';
  messagesEl.scrollTop = messagesEl.scrollHeight;
  saveToHistory('user', message);
  
  const response = await sendMessageToAPI(message);
  messagesEl.appendChild(createMessageBubble(response, 'bot'));
  messagesEl.scrollTop = messagesEl.scrollHeight;
  saveToHistory('bot', response);
}

// ========== Chat History Management ==========
function saveToHistory(sender, text) {
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  history.push({ sender, text });
  localStorage.setItem('chatHistory', JSON.stringify(history));
}

function loadChatHistory(mode = 'desktop') {
  const messagesEl = getElement(mode === 'mobile' ? 'mobileMessages' : 'messages');
  if (!messagesEl) return;
  
  messagesEl.innerHTML = '';
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  
  history.forEach(entry => {
    messagesEl.appendChild(createMessageBubble(entry.text, entry.sender));
  });
  
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ========== Chat UI Controls ==========
function toggleChatPopup() {
  const modal = getElement('mobileChatModal');
  toggleElement(modal);
  loadChatHistory('mobile');
  setTimeout(() => {
    const el = getElement('mobileMessages');
    if (el) el.scrollTop = el.scrollHeight;
  }, 200);
}

function leaveMobileChat() {
  hideElement(getElement('mobileChatModal'));
  localStorage.removeItem('chatHistory');
}

function startChat() {
  const chatBox = getElement('chatBox');
  const startBtn = getElement('startChatBtn');
  
  if (chatBox && startBtn) {
    showElement(chatBox);
    hideElement(startBtn);
    setTimeout(() => chatBox.scrollTop = chatBox.scrollHeight, 100);
  }
  
  loadChatHistory('desktop');
}

function leaveChat() {
  const chatBox = getElement('chatBox');
  const startBtn = getElement('startChatBtn');
  
  if (chatBox && startBtn) {
    hideElement(chatBox);
    showElement(startBtn);
  }
  
  localStorage.removeItem('chatHistory');
}

// ========== Sidebar Functions ==========
function setupSidebar() {
  const button = getElement('hamburgerBtn');
  const sidebar = getElement('sidebar');

  const handleDesktopHover = () => {
    if (window.innerWidth >= 768) {
      showElement(sidebar);
      sidebar.classList.add('sidebar-animate');
      hideElement(button);
    }
  };

  const handleDesktopLeave = () => {
    if (window.innerWidth >= 768) {
      hideElement(sidebar);
      sidebar.classList.remove('sidebar-animate');
      showElement(button);
    }
  };

  button?.addEventListener('mouseenter', handleDesktopHover);
  sidebar?.addEventListener('mouseleave', handleDesktopLeave);
  button?.addEventListener('click', () => window.innerWidth < 768 && (showElement(sidebar), sidebar.classList.add('sidebar-animate'), hideElement(button)));
  sidebar?.addEventListener('click', e => window.innerWidth < 768 && closeSidebar());
}

function closeSidebar() {
  hideElement(getElement('sidebar'));
  showElement(getElement('hamburgerBtn'));
}

// ========== OCR Functions ==========
function setupOCRForm() {
  const form = getElement('uploadForm');
  const status = getElement('status');
  const imageInput = getElement('imageInput');
  const imagePreviewContainer = getElement('imagePreviewContainer');
  const imagePreview = getElement('imagePreview');
  const scanOverlay = getElement('scanOverlay');
  const dropArea = document.querySelector('.border-dashed');

  if (!form || !dropArea) return;

  const preventDefaults = e => (e.preventDefault(), e.stopPropagation());
  const highlight = el => el.classList.add('border-blue-500', 'bg-blue-50');
  const unhighlight = el => el.classList.remove('border-blue-500', 'bg-blue-50');

  const handleDrop = e => {
    const files = e.dataTransfer.files;
    if (files.length) {
      imageInput.files = files;
      updateImagePreview(files[0]);
    }
  };

  const updateImagePreview = file => {
    const reader = new FileReader();
    reader.onload = e => (imagePreview.src = e.target.result, showElement(imagePreviewContainer));
    reader.readAsDataURL(file);
  };

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => 
    dropArea.addEventListener(evt, preventDefaults));
  ['dragenter', 'dragover'].forEach(evt => 
    dropArea.addEventListener(evt, () => highlight(dropArea)));
  ['dragleave', 'drop'].forEach(evt => 
    dropArea.addEventListener(evt, () => unhighlight(dropArea)));
  dropArea.addEventListener('drop', handleDrop);
  imageInput.addEventListener('change', () => 
    imageInput.files.length ? updateImagePreview(imageInput.files[0]) : hideElement(imagePreviewContainer));
  form.addEventListener('submit', handleFormSubmit);

  async function handleFormSubmit(e) {
    e.preventDefault();
    status.textContent = "";
    status.className = "text-center text-sm py-2 rounded-lg transition-all duration-300";
    showElement(scanOverlay);

    try {
      const response = await fetch("https://n8n.connexa.net.id/webhook/05ef3562-081c-44d8-87f0-4f135385fb2f", {
        method: "POST",
        body: new FormData(form),
      });

      setTimeout(async () => {
        hideElement(scanOverlay);
        if (response.ok) {
          showElement(getElement('successModal'));
          status.textContent = "Document processed successfully!";
          status.classList.replace('text-red-500', 'text-green-700');
          status.classList.replace('bg-red-50', 'bg-green-50');
          form.reset();
          hideElement(imagePreviewContainer);
        } else throw new Error("Upload failed");
      }, 6000);
    } catch {
      hideElement(scanOverlay);
      status.textContent = "Failed to process document. Please try again.";
      status.classList.replace('text-green-700', 'text-red-500');
      status.classList.replace('bg-green-50', 'bg-red-50');
    }
  }
}

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => (hideElement(getElement('splash')), showElement(getElement('main-content'))), 1200);

  checkAuth();
  initializeChat();
  setupSidebar();
  setupOCRForm();

  getElement('proceedBtn')?.addEventListener('click', () => hideElement(getElement('successModal')));

  window.addEventListener('pageshow', event => {
    if ((event.persisted || (window.performance?.navigation?.type === 2)) && !localStorage.getItem('user')) {
      window.location.href = 'index.html';
    }
  });
});