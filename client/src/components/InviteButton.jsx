import { useState } from 'react';

const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin;

export default function InviteButton({ gameCode, playerName }) {
  const [inviteStatus, setInviteStatus] = useState('idle');

  const handleInvite = async () => {
    const link = `${BASE_URL}?room=${gameCode}`;
    const message = `${playerName} is inviting you to play 1-4-24... join the game now! ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        // user dismissed share sheet
      }
    } else {
      await navigator.clipboard.writeText(message);
      setInviteStatus('copied');
      setTimeout(() => setInviteStatus('idle'), 2000);
    }
  };

  return (
    <button className="btn btn-invite" onClick={handleInvite}>
      {inviteStatus === 'copied' ? '✓ Copied!' : 'Invite Friends'}
    </button>
  );
}
