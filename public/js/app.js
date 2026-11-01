(() => {
  let me = null;
  let selectedUser = null;

  const authView = document.getElementById('auth-view');
  const chatView = document.getElementById('chat-view');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const authError = document.getElementById('auth-error');
  const meName = document.getElementById('me-name');
  const userList = document.getElementById('user-list');
  const chatWith = document.getElementById('chat-with');
  const messageList = document.getElementById('message-list');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const attachBtn = document.getElementById('attach-btn');
  const attachmentInput = document.getElementById('attachment-input');

  document.getElementById('go-signup').onclick = e => { e.preventDefault(); loginForm.classList.add('hidden'); signupForm.classList.remove('hidden'); };
  document.getElementById('go-login').onclick = e => { e.preventDefault(); signupForm.classList.add('hidden'); loginForm.classList.remove('hidden'); };

  function showError(msg) { authError.textContent = msg; authError.classList.remove('hidden'); }

  signupForm.onsubmit = async e => {
    e.preventDefault();
    try {
      await Api.signup(
        document.getElementById('signup-username').value,
        document.getElementById('signup-email').value,
        document.getElementById('signup-password').value
      );
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    } catch (err) { showError(err.message); }
  };

  loginForm.onsubmit = async e => {
    e.preventDefault();
    try {
      const username = document.getElementById('login-username').value;
      const { accessToken, userId } = await Api.login(username, document.getElementById('login-password').value);
      Api.setToken(accessToken);
      me = { username, userId };
      await enterChat(accessToken);
    } catch (err) { showError(err.message); }
  };

  document.getElementById('logout-btn').onclick = () => location.reload();

  async function enterChat(token) {
    authView.classList.add('hidden');
    chatView.classList.remove('hidden');
    meName.textContent = me.username;

    renderUserList(await Api.listUsers());

    WsClient.connect(token);
    WsClient.onMessage(renderIncoming);
  }

  function renderUserList(users) {
    userList.innerHTML = '';
    users.forEach(u => {
      const li = document.createElement('li');
      li.textContent = u.username;
      li.onclick = () => selectUser(u);
      userList.appendChild(li);
    });
  }

  async function selectUser(user) {
    selectedUser = user;
    [...userList.children].forEach(li => li.classList.toggle('active', li.textContent === user.username));
    chatWith.textContent = `Chat with ${user.username}`;
    messageForm.classList.remove('hidden');
    messageList.innerHTML = '';
    const history = await Api.getMessages(user.userId);
    history.forEach(renderMessage);
  }

  function renderMessage(m) {
    const li = document.createElement('li');
    li.className = m.senderId === me.userId ? 'mine' : '';
    li.textContent = m.text;
    if (m.attachmentUrl) {
      const img = document.createElement('img');
      img.src = m.attachmentUrl;
      li.appendChild(img);
    }
    messageList.appendChild(li);
    messageList.scrollTop = messageList.scrollHeight;
  }

  function renderIncoming(msg) {
    if (msg.type !== 'message') return;
    const relevant = selectedUser && (msg.senderId === selectedUser.userId || msg.senderId === me.userId);
    if (relevant) renderMessage(msg);
  }

  let pendingAttachmentKey = null;

  attachBtn.onclick = () => attachmentInput.click();

  attachmentInput.onchange = async () => {
    const file = attachmentInput.files[0];
    if (!file) return;
    const { uploadUrl, key } = await Api.presignUpload(file.name, file.type);
    await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    pendingAttachmentKey = key;
    messageInput.placeholder = `Attached: ${file.name} — add a message and send`;
  };

  messageForm.onsubmit = e => {
    e.preventDefault();
    if (!selectedUser || !messageInput.value) return;
    WsClient.send(selectedUser.userId, messageInput.value, pendingAttachmentKey || undefined);
    messageInput.value = '';
    pendingAttachmentKey = null;
    messageInput.placeholder = 'Type a message...';
  };
})();
