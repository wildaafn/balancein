/**
 * BalanceIn — AI Coach View
 * Chat interface powered by Gemini AI with context-aware suggestions.
 */

const AICoach = (() => {
  let isLoading = false;

  function render() {
    const container = document.getElementById('view-ai');
    const history = Storage.getChatHistory();

    container.innerHTML = `
      <div class="chat-container">
        <!-- Chat Messages -->
        <div class="chat-messages" id="chat-messages">
          ${
            history.length === 0
              ? renderWelcome()
              : history.map((msg) => renderBubble(msg.role, msg.content)).join('')
          }
        </div>

        <!-- Suggestion Chips (shown when no messages) -->
        ${history.length === 0 ? renderSuggestions() : ''}

        <!-- Chat Input -->
        <div class="chat-input-area">
          <input type="text" class="chat-input" id="chat-input"
            placeholder="Tanya AI Coach..."
            autocomplete="off"
            ${isLoading ? 'disabled' : ''}>
          <button class="chat-send-btn" id="chat-send" ${isLoading ? 'disabled' : ''}>
            ${isLoading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    `;

    attachEvents(container);

    // Auto-scroll to bottom
    const messages = document.getElementById('chat-messages');
    if (messages) messages.scrollTop = messages.scrollHeight;
  }

  function renderWelcome() {
    return `
      <div style="text-align:center;padding:32px 16px;">
        <div style="font-size:3rem;margin-bottom:16px;">🤖</div>
        <h2 style="font-family:var(--font-heading);font-size:1.3rem;margin-bottom:8px;">
          Halo! Saya <span style="color:var(--emerald-400);">BalanceIn Coach</span>
        </h2>
        <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.7;max-width:320px;margin:0 auto;">
          Saya asisten AI yang siap membantu kamu menjaga keseimbangan hidup — kesehatan, mental, dan ibadah. 
          Tanya apa saja! 🌟
        </p>
      </div>
    `;
  }

  function renderSuggestions() {
    const suggestions = [
      'Tips menjaga semangat ibadah',
      'Cara minum air 8 gelas sehari',
      'Bagaimana mengatasi malas olahraga?',
      'Dzikir apa yang dianjurkan setelah sholat?',
      'Tips tidur berkualitas menurut Islam',
      'Analisis progress saya hari ini',
    ];

    return `
      <div class="suggestion-chips" id="suggestion-chips">
        ${suggestions.map((s) => `<button class="suggestion-chip" data-suggestion="${s}">${s}</button>`).join('')}
      </div>
    `;
  }

  function renderBubble(role, content) {
    if (role === 'user') {
      return `<div class="chat-bubble user">${escapeHtml(content)}</div>`;
    }
    return `
      <div class="chat-bubble ai">
        <div class="sender">🤖 BalanceIn Coach</div>
        <div>${formatAIResponse(content)}</div>
      </div>
    `;
  }

  function renderTyping() {
    return `
      <div class="typing-indicator" id="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatAIResponse(text) {
    // Basic markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  async function sendMessage(message) {
    if (!message.trim() || isLoading) return;

    const messages = document.getElementById('chat-messages');
    const suggestionsEl = document.getElementById('suggestion-chips');

    // Remove suggestions
    if (suggestionsEl) suggestionsEl.remove();

    // Add user bubble
    Storage.saveChatMessage('user', message);
    messages.insertAdjacentHTML('beforeend', renderBubble('user', message));

    // Show typing
    messages.insertAdjacentHTML('beforeend', renderTyping());
    messages.scrollTop = messages.scrollHeight;

    // Disable input
    isLoading = true;
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    if (input) input.disabled = true;
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '⏳'; }

    try {
      const context = Storage.getContextForAI();
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });

      const data = await res.json();
      const response = data.response || data.fallback || 'Maaf, terjadi kesalahan. Coba lagi ya! 🙏';

      // Remove typing indicator
      const typing = document.getElementById('typing-indicator');
      if (typing) typing.remove();

      // Add AI bubble
      Storage.saveChatMessage('ai', response);
      messages.insertAdjacentHTML('beforeend', renderBubble('ai', response));
      messages.scrollTop = messages.scrollHeight;
    } catch (error) {
      console.error('Chat error:', error);
      const typing = document.getElementById('typing-indicator');
      if (typing) typing.remove();

      const fallback = 'Maaf, saya sedang tidak bisa merespons. Pastikan koneksi internet kamu aktif ya! 🌐';
      Storage.saveChatMessage('ai', fallback);
      messages.insertAdjacentHTML('beforeend', renderBubble('ai', fallback));
    } finally {
      isLoading = false;
      if (input) { input.disabled = false; input.focus(); }
      if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '➤'; }
    }
  }

  function attachEvents(container) {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');

    // Send on button click
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        if (input) {
          sendMessage(input.value);
          input.value = '';
        }
      });
    }

    // Send on Enter
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(input.value);
          input.value = '';
        }
      });
    }

    // Suggestion chips
    container.querySelectorAll('.suggestion-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const suggestion = chip.dataset.suggestion;
        if (input) input.value = suggestion;
        sendMessage(suggestion);
        if (input) input.value = '';
      });
    });
  }

  return { render };
})();
