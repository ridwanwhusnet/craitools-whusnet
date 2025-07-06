// ========== Utility Functions ==========
const $ = id => document.getElementById(id);
const hide = el => el?.classList.add('hidden');
const show = el => el?.classList.remove('hidden');
const toggle = el => el?.classList.toggle('hidden');

// ========== Credentials ==========
const credentials = {
  'ridwanarisandy@gmail.com': CryptoJS.SHA256('123').toString(),
  'whusnetreport@gmail.com': CryptoJS.SHA256('12345').toString(),
  'sandi': CryptoJS.SHA256('1234').toString()
};

// ========== Auth Form Handler ==========
$('auth-form').addEventListener('submit', e => {
  e.preventDefault();
  const username = $('user-name').value.trim();
  const password = $('user-pass').value.trim();
  const hashedPassword = CryptoJS.SHA256(password).toString();
  const errorMsg = $('error-msg');

  if (credentials[username] === hashedPassword) {
    localStorage.setItem('user', username);
    window.location.href = 'dashboard.html';
  } else {
    show(errorMsg);
  }
});

// ========== Typing Effect ==========
const words = ["Smarter", "Faster", "Smoother"];
let current = 0, char = 0, del = false;

function typeEffect() {
  const word = words[current];
  $('typing').textContent = word.substring(0, char);
  char += del ? -1 : 1;
  
  if (char === word.length + 1) del = true;
  if (char < 0) {
    del = false;
    current = (current + 1) % words.length;
  }
  setTimeout(typeEffect, del ? 150 : 300);
}

// ========== Cursor Blinking ==========
setInterval(() => {
  $('cursor').style.opacity = $('cursor').style.opacity === "0" ? "1" : "0";
}, 500);

// ========== Modal Handlers ==========
function openModal() {
  const modal = $("signup-modal");
  show(modal);
  modal.querySelector(".bg-white").classList.add("animate-modal");
}

function closeModal() {
  hide($("signup-modal"));
}

// ========== Event Listeners ==========
document.querySelectorAll("button, a").forEach(el => {
  if (el.textContent.trim() === "Sign up") {
    el.addEventListener("click", openModal);
  }
});

$("signup-form").addEventListener("submit", e => {
  e.preventDefault();
  const email = $("signup-email").value.trim();
  const pass = $("signup-pass").value.trim();
  window.open(
    `https://wa.me/6289687938315?text=Halo min, saya mau request akses.%0AEmail: ${email}%0APassword: ${pass}`,
    '_blank'
  );
});

// ========== Splash Screen Handler ==========
window.addEventListener('load', () => {
  setTimeout(() => {
    hide($('splash'));
    show($('main-content'));
    typeEffect();
  }, 1200);
});