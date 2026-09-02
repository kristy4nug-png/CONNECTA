document.addEventListener("DOMContentLoaded", () => {
  const addContactForm = document.getElementById("addContactForm");
  const contactName = document.getElementById("contactName");
  const contactRole = document.getElementById("contactRole");
  const contactPhone = document.getElementById("contactPhone");
  const privateContactsList = document.getElementById("privateContactsList");
  const safetyPlanEmergencyContacts = document.getElementById("safetyPlanEmergencyContacts");
  const toolsEmergencyContacts = document.getElementById("toolsEmergencyContacts");

  if (!addContactForm || !privateContactsList) return;

  const STORAGE_KEY = "atlasContactsV1";

  const getContacts = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };

  const saveContacts = (contacts) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  };

  const escapeHtml = (unsafe) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  };

  const renderContacts = () => {
    const contacts = getContacts();
    
    // 1. Render Phonebook (blurred numbers)
    privateContactsList.innerHTML = "";
    if (contacts.length === 0) {
      privateContactsList.innerHTML = '<div class="empty">No contacts added yet.</div>';
    } else {
      contacts.forEach(c => {
        const el = document.createElement("div");
        el.style.background = "rgba(255, 255, 255, 0.6)";
        el.style.border = "1px solid var(--line)";
        el.style.borderRadius = "8px";
        el.style.padding = "12px";
        el.style.display = "flex";
        el.style.justifyContent = "space-between";
        el.style.alignItems = "center";
        
        const blurredPhone = c.phone.slice(0, -4).replace(/[0-9]/g, '*') + c.phone.slice(-4);
        
        el.innerHTML = `
          <div>
            <div style="font-weight: 600; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
              ${escapeHtml(c.name)}
              <span style="font-size: 0.7rem; background: var(--teal); color: white; padding: 2px 6px; border-radius: 4px;">${escapeHtml(c.role)}</span>
            </div>
            <div style="color: var(--navy); opacity: 0.7; font-family: monospace; letter-spacing: 2px;">${blurredPhone}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="tel:${encodeURIComponent(c.phone)}" class="primary" style="text-decoration: none; padding: 8px 16px;">Call</a>
            <button class="ghost delete-contact-btn" data-id="${c.id}" style="padding: 8px;">✕</button>
          </div>
        `;
        privateContactsList.appendChild(el);
      });
    }

    // 2. Render Safety Plan Emergency Feed
    if (safetyPlanEmergencyContacts) {
      safetyPlanEmergencyContacts.innerHTML = "";
      if (contacts.length > 0) {
        const header = document.createElement("div");
        header.style.fontWeight = "bold";
        header.style.marginBottom = "8px";
        header.style.color = "var(--danger)";
        header.textContent = "Emergency Contacts:";
        safetyPlanEmergencyContacts.appendChild(header);

        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "1fr 1fr";
        grid.style.gap = "8px";

        contacts.forEach(c => {
          const btn = document.createElement("a");
          btn.href = `tel:${encodeURIComponent(c.phone)}`;
          btn.style.display = "flex";
          btn.style.flexDirection = "column";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.background = "var(--danger)";
          btn.style.color = "white";
          btn.style.padding = "12px";
          btn.style.borderRadius = "8px";
          btn.style.textDecoration = "none";
          btn.style.textAlign = "center";
          btn.style.boxShadow = "var(--shadow-sm)";

          btn.innerHTML = `
            <span style="font-weight: bold; font-size: 1.1rem;">Call ${escapeHtml(c.name)}</span>
            <span style="font-size: 0.8rem; opacity: 0.9;">${escapeHtml(c.role)}</span>
          `;
          grid.appendChild(btn);
        });
        safetyPlanEmergencyContacts.appendChild(grid);
      }
    }

    // 3. Render Tools tab quick-call buttons
    if (toolsEmergencyContacts) {
      toolsEmergencyContacts.innerHTML = "";
      if (contacts.length === 0) {
        toolsEmergencyContacts.innerHTML = '<div class="empty">No contacts saved yet. Add them on the My Plan tab.</div>';
      } else {
        contacts.forEach(c => {
          const btn = document.createElement("a");
          btn.href = `tel:${encodeURIComponent(c.phone)}`;
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "space-between";
          btn.style.background = "linear-gradient(135deg, var(--teal), var(--teal2))";
          btn.style.color = "white";
          btn.style.padding = "14px 18px";
          btn.style.borderRadius = "10px";
          btn.style.textDecoration = "none";
          btn.style.boxShadow = "var(--shadow-sm)";
          btn.innerHTML = `
            <div>
              <div style="font-weight: 700; font-size: 1.05rem;">📞 ${escapeHtml(c.name)}</div>
              <div style="font-size: 0.8rem; opacity: 0.85;">${escapeHtml(c.role)}</div>
            </div>
            <span style="font-size: 1.5rem;">→</span>
          `;
          toolsEmergencyContacts.appendChild(btn);
        });
      }
    }

    // Attach delete listeners
    document.querySelectorAll(".delete-contact-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        const newContacts = getContacts().filter(c => c.id !== id);
        saveContacts(newContacts);
        renderContacts();
      });
    });
  };

  addContactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = contactName.value.trim();
    const role = contactRole.value;
    const phone = contactPhone.value.trim();

    if (!name || !role || !phone) return;

    const contacts = getContacts();
    contacts.push({
      id: crypto.randomUUID(),
      name,
      role,
      phone
    });

    saveContacts(contacts);
    addContactForm.reset();
    renderContacts();
  });

  // Initial render
  renderContacts();
});
