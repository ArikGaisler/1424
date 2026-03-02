import { useState, useRef, useEffect } from 'react';

export default function Chat({ messages, sendMessage }) {
  const [text, setText] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const bottomRef = useRef(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!collapsed) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnread(0);
    } else {
      setUnread(prev => prev + 1);
    }
  }, [messages.length, collapsed]);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg) return;
    sendMessage(msg);
    setText('');
  };

  return (
    <div className={`chat ${collapsed ? 'chat-collapsed' : ''}`}>
      <button className="chat-header" onClick={() => {
        setCollapsed(!collapsed);
        if (collapsed) setUnread(0);
      }}>
        <span>Chat</span>
        {collapsed && unread > 0 && <span className="chat-unread">{unread}</span>}
        <span className="chat-toggle">{collapsed ? '\u25B2' : '\u25BC'}</span>
      </button>

      {!collapsed && (
        <>
          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="chat-empty">No messages yet</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className="chat-msg">
                <span className="chat-name">{m.name}</span>
                <span className="chat-text">{m.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              maxLength={200}
            />
            <button onClick={handleSend} disabled={!text.trim()}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}
