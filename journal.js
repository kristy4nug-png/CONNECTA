document.addEventListener("DOMContentLoaded", () => {
  const journalForm = document.getElementById("journalForm");
  const journalInput = document.getElementById("journalInput");
  const journalEntriesContainer = document.getElementById("journalEntries");

  if (!journalForm || !journalEntriesContainer) return;

  const STORAGE_KEY = "atlasJournalV1";

  const getEntries = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };

  const saveEntries = (entries) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  };

  const escapeHtml = (unsafe) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  };

  const renderEntries = () => {
    const entries = getEntries();
    journalEntriesContainer.innerHTML = "";
    
    if (entries.length === 0) {
      journalEntriesContainer.innerHTML = '<div class="empty">No journal entries yet.</div>';
      return;
    }

    // Sort newest first
    entries.sort((a, b) => b.timestamp - a.timestamp);

    entries.forEach(entry => {
      const dateStr = new Date(entry.timestamp).toLocaleString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      
      const el = document.createElement("div");
      el.style.background = "rgba(255, 255, 255, 0.6)";
      el.style.border = "1px solid var(--line)";
      el.style.borderRadius = "8px";
      el.style.padding = "16px";
      el.style.boxShadow = "var(--shadow-sm)";
      
      const text = escapeHtml(entry.text).replace(/\n/g, "<br>");
      
      el.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--navy); opacity: 0.7; margin-bottom: 8px; font-weight: 600;">${dateStr}</div>
        <div style="font-size: 1rem; color: var(--ink); line-height: 1.5;">${text}</div>
      `;
      journalEntriesContainer.appendChild(el);
    });
  };

  journalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = journalInput.value.trim();
    if (!text) return;
    
    const entries = getEntries();
    entries.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      text: text
    });
    
    saveEntries(entries);
    journalInput.value = "";
    renderEntries();
    
    // Quick success feedback
    const btn = journalForm.querySelector("button");
    const originalText = btn.textContent;
    btn.textContent = "Saved ✓";
    setTimeout(() => { btn.textContent = originalText; }, 2000);
  });

  // Initial render
  renderEntries();
});
