const WsClient = (() => {
  let socket = null;
  let onMessage = () => {};

  function connect(token) {
    socket = new WebSocket(`ws://${location.host}/ws?token=${encodeURIComponent(token)}`);
    socket.onmessage = e => onMessage(JSON.parse(e.data));
  }

  function send(to, text, attachmentKey) {
    socket.send(JSON.stringify({ type: 'message', to, text, attachmentKey }));
  }

  return {
    connect,
    send,
    onMessage: fn => { onMessage = fn; }
  };
})();
