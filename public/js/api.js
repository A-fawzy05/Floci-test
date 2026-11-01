const Api = (() => {
  let token = null;
  const setToken = t => { token = t; };

  async function call(method, path, body) {
    const res = await fetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `request failed (${res.status})`);
    return data;
  }

  return {
    setToken,
    signup: (username, email, password) => call('POST', '/api/auth/signup', { username, email, password }),
    login: (username, password) => call('POST', '/api/auth/login', { username, password }),
    listUsers: () => call('GET', '/api/users'),
    getMessages: otherUserId => call('GET', `/api/messages/${encodeURIComponent(otherUserId)}`),
    presignUpload: (filename, contentType) => call('POST', '/api/attachments/presign', { filename, contentType })
  };
})();
