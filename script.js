let state = {
currentUser: null,
currentFolder: 'Inbox',
searchFilter: ''
};
const config = {
repoOwner: 'YOUR_GITHUB_USERNAME',
repoName: 'zypermail.github.io',
authToken: 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN'
};
function initStorage() {
if (!localStorage.getItem('zm_accounts')) {
localStorage.setItem('zm_accounts', JSON.stringify([]));
}
if (!localStorage.getItem('zm_messages')) {
const defaultMails = [
{ id: 1, sender: 'system@zypermail.com', recipient: 'root@zypermail.com', subject: 'Core Framework Notification', body: 'The primary storage subsystem architecture is up and running via local node interfaces.', date: '10:28 AM' },
{ id: 2, sender: 'git-pages@zypermail.com', recipient: 'root@zypermail.com', subject: 'Deployment Finalized', body: 'Domain routing for zypermail.github.io is verified and operational globally.', date: '08:14 PM' }
];
localStorage.setItem('zm_messages', JSON.stringify(defaultMails));
}
const sessionUser = sessionStorage.getItem('zm_session_user');
if (sessionUser) {
state.currentUser = sessionUser;
}
}
function getAccounts() {
return JSON.parse(localStorage.getItem('zm_accounts'));
}
function getMessages() {
return JSON.parse(localStorage.getItem('zm_messages'));
}
function saveMessage(msg) {
const dynamicMails = getMessages();
dynamicMails.unshift(msg);
localStorage.setItem('zm_messages', JSON.stringify(dynamicMails));
}
function toggleModal(id, open) {
const modal = document.getElementById(id);
if (open) modal.classList.add('active');
else modal.classList.remove('active');
}
function updateUI() {
const userDisplay = document.getElementById('currentUserDisplay');
const regBtn = document.getElementById('btnRegisterNav');
const compBtn = document.getElementById('btnComposeNav');
const logBtn = document.getElementById('btnLogoutNav');
if (state.currentUser) {
userDisplay.textContent = state.currentUser + '@zypermail.com';
regBtn.style.display = 'none';
compBtn.style.display = 'block';
logBtn.style.display = 'block';
} else {
userDisplay.textContent = 'Not logged in';
regBtn.style.display = 'block';
compBtn.style.display = 'none';
logBtn.style.display = 'none';
}
renderMailbox();
}
function renderMailbox() {
const viewer = document.getElementById('mailViewer');
viewer.innerHTML = '';
const allMails = getMessages();
const targetUser = state.currentUser ? state.currentUser + '@zypermail.com' : 'root@zypermail.com';
let filtered = allMails.filter(m => {
if (state.currentFolder === 'Inbox') {
return m.recipient.toLowerCase() === targetUser.toLowerCase();
} else {
return m.sender.toLowerCase() === targetUser.toLowerCase();
}
});
if (state.searchFilter) {
const term = state.searchFilter.toLowerCase();
filtered = filtered.filter(m => 
m.sender.toLowerCase().includes(term) || 
m.recipient.toLowerCase().includes(term) || 
m.subject.toLowerCase().includes(term) || 
m.body.toLowerCase().includes(term)
);
}
if (filtered.length === 0) {
viewer.innerHTML = '<div class="empty-state">No structural communications record matches the parameters.</div>';
return;
}
filtered.forEach(m => {
const item = document.createElement('div');
item.className = 'email-item';
const displayAddress = state.currentFolder === 'Inbox' ? m.sender : `To: ${m.recipient}`;
item.innerHTML = `
<div class="sender">${displayAddress}</div>
<div class="content-preview">
<span class="subject">${m.subject}</span>
<span class="snippet"> — ${m.body}</span>
</div>
<div class="date">${m.date}</div>
`;
viewer.appendChild(item);
});
}
async function dispatchBackendRelay(sender, recipient, subject, body) {
if (config.authToken === 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN' || !config.repoOwner) {
console.warn("Backend API tokens unconfigured. Skipping remote event dispatch pipeline.");
return;
}
const endpoint = `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/dispatches`;
const payload = {
event_type: 'mail_webhook',
client_payload: {
action: 'send_mail',
sender: sender,
recipient: recipient,
subject: subject,
body: body
}
};
try {
await fetch(endpoint, {
method: 'POST',
headers: {
'Authorization': `token ${config.authToken}`,
'Accept': 'application/vnd.github.v3+json',
'Content-Type': 'application/json'
},
body: JSON.stringify(payload)
});
} catch (err) {
console.error("Backend pipeline dispatch interrupt: ", err);
}
}
document.getElementById('btnRegisterNav').addEventListener('click', () => toggleModal('authModal', true));
document.getElementById('closeAuthBtn').addEventListener('click', () => toggleModal('authModal', false));
document.getElementById('btnComposeNav').addEventListener('click', () => toggleModal('composeModal', true));
document.getElementById('closeComposeBtn').addEventListener('click', () => toggleModal('composeModal', false));
document.getElementById('btnLogoutNav').addEventListener('click', () => {
state.currentUser = null;
sessionStorage.removeItem('zm_session_user');
updateUI();
});
document.getElementById('authForm').addEventListener('submit', (e) => {
e.preventDefault();
e.stopPropagation();
const rawUser = document.getElementById('authUsername').value.trim();
if (!rawUser) return;
const accounts = getAccounts();
if (!accounts.includes(rawUser.toLowerCase())) {
accounts.push(rawUser.toLowerCase());
localStorage.setItem('zm_accounts', JSON.stringify(accounts));
}
state.currentUser = rawUser.toLowerCase();
sessionStorage.setItem('zm_session_user', state.currentUser);
toggleModal('authModal', false);
document.getElementById('authForm').reset();
updateUI();
});
document.getElementById('composeForm').addEventListener('submit', (e) => {
e.preventDefault();
e.stopPropagation();
if (!state.currentUser) return;
let targetRecipient = document.getElementById('msgRecipient').value.trim();
if (!targetRecipient.includes('@')) {
targetRecipient += '@zypermail.com';
}
const subjectText = document.getElementById('msgSubject').value.trim();
const bodyText = document.getElementById('msgBody').value.trim();
const now = new Date();
const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const senderEmail = state.currentUser + '@zypermail.com';
const newMail = {
id: Date.now(),
sender: senderEmail,
recipient: targetRecipient,
subject: subjectText,
body: bodyText,
date: formattedTime
};
saveMessage(newMail);
if (!targetRecipient.toLowerCase().endsWith('@zypermail.com')) {
dispatchBackendRelay(senderEmail, targetRecipient, subjectText, bodyText);
}
toggleModal('composeModal', false);
document.getElementById('composeForm').reset();
renderMailbox();
});
document.getElementById('folderInbox').addEventListener('click', (e) => {
document.getElementById('folderInbox').classList.add('active');
document.getElementById('folderSent').classList.remove('active');
state.currentFolder = 'Inbox';
renderMailbox();
});
document.getElementById('folderSent').addEventListener('click', (e) => {
document.getElementById('folderSent').classList.add('active');
document.getElementById('folderInbox').classList.remove('active');
state.currentFolder = 'Sent';
renderMailbox();
});
document.getElementById('searchInput').addEventListener('input', (e) => {
state.searchFilter = e.target.value;
renderMailbox();
});
window.addEventListener('DOMContentLoaded', () => {
initStorage();
updateUI();
});
</script>
