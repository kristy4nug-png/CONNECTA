document.addEventListener("DOMContentLoaded", () => {
  const dailyReprieveBtn = document.getElementById("dailyReprieveBtn");
  const dailyReprieveStatus = document.getElementById("dailyReprieveStatus");
  const totalReprievesText = document.getElementById("totalReprievesText");
  const badgesContainer = document.getElementById("badgesContainer");
  const downloadCertificateBtn = document.getElementById("downloadCertificateBtn");
  
  // Elements for print template
  const certNameLine = document.getElementById("certNameLine");
  const certMilestoneText = document.getElementById("certMilestoneText");
  const certDateLine = document.getElementById("certDateLine");
  
  if (!dailyReprieveBtn || !totalReprievesText) return;

  const ICONS = {
    sun: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    compass: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
    mountain: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`,
    anchor: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" x2="12" y1="8" y2="22"/><line x1="5" x2="19" y1="12" y2="12"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>`,
    heart: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    shield: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
    diamond: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/></svg>`,
    flag: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  };

  const getMilestones = () => {
    try {
      return JSON.parse(localStorage.getItem("atlasMilestonesV1")) || [];
    } catch {
      return [];
    }
  };

  const saveMilestones = (dates) => {
    localStorage.setItem("atlasMilestonesV1", JSON.stringify(dates));
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const badgeConfigs = [
    { days: 1, label: "1 Day", icon: ICONS.sun, color: "var(--teal)" },
    { days: 7, label: "1 Week", icon: ICONS.compass, color: "var(--teal)" },
    { days: 14, label: "2 Weeks", icon: ICONS.mountain, color: "var(--teal)" },
    { days: 21, label: "3 Weeks", icon: ICONS.anchor, color: "var(--teal)" },
    { days: 30, label: "1 Month", icon: ICONS.heart, color: "var(--amber)" },
    { days: 60, label: "2 Months", icon: ICONS.shield, color: "var(--amber)" },
    { days: 90, label: "3 Months", icon: ICONS.diamond, color: "var(--amber)" },
    { days: 120, label: "4 Months", icon: ICONS.flag, color: "var(--amber)" },
    { days: 150, label: "5 Months", icon: ICONS.sun, color: "var(--amber)" },
    { days: 180, label: "6 Months", icon: ICONS.compass, color: "var(--amber)" },
    { days: 210, label: "7 Months", icon: ICONS.mountain, color: "var(--amber)" },
    { days: 240, label: "8 Months", icon: ICONS.anchor, color: "var(--amber)" },
    { days: 270, label: "9 Months", icon: ICONS.heart, color: "var(--amber)" },
    { days: 300, label: "10 Months", icon: ICONS.shield, color: "var(--amber)" },
    { days: 330, label: "11 Months", icon: ICONS.diamond, color: "var(--amber)" },
    { days: 365, label: "1 Year", icon: ICONS.star, color: "var(--navy)" },
    { days: 730, label: "2 Years", icon: ICONS.star, color: "var(--navy)" },
    { days: 1095, label: "3 Years", icon: ICONS.star, color: "var(--navy)" },
    { days: 1460, label: "4 Years", icon: ICONS.star, color: "var(--navy)" },
    { days: 1825, label: "5 Years", icon: ICONS.star, color: "var(--navy)" }
  ];

  const updateMilestoneUI = () => {
    const dates = getMilestones();
    const total = dates.length;
    const todayStr = getTodayStr();
    
    // Update Home tab button
    if (dates.includes(todayStr)) {
      dailyReprieveBtn.textContent = "Done for today. Share again?";
      dailyReprieveBtn.classList.replace("primary", "secondary");
      dailyReprieveStatus.textContent = `Amazing work. You have logged ${total} total reprieves.`;
      dailyReprieveStatus.style.display = "block";
    }

    // Update Plan tab text
    totalReprievesText.textContent = `You have completed ${total} daily reprieves.`;

    // Render Badges
    badgesContainer.innerHTML = badgeConfigs.map(b => {
      const unlocked = total >= b.days;
      return `
        <div class="milestone-badge" style="
          flex: 0 0 auto; 
          scroll-snap-align: start;
          opacity: ${unlocked ? '1' : '0.4'}; 
          filter: ${unlocked ? 'none' : 'grayscale(100%)'}; 
          background: rgba(255,255,255,0.7); 
          border: 2px solid ${unlocked ? b.color : 'var(--line)'}; 
          border-radius: 16px; 
          padding: 16px; 
          text-align: center; 
          width: 100px; 
          box-shadow: var(--shadow-sm);
          color: ${b.color};
        ">
          <div style="margin-bottom: 8px; display: flex; justify-content: center;">${b.icon}</div>
          <div style="font-size: 0.9rem; font-weight: 900;">${b.label}</div>
        </div>
      `;
    }).join("");

    // Enable certificate if at least 1 badge is unlocked
    if (total >= 1) {
      downloadCertificateBtn.disabled = false;
    } else {
      downloadCertificateBtn.disabled = true;
    }
  };

  dailyReprieveBtn.addEventListener("click", () => {
    const dates = getMilestones();
    const todayStr = getTodayStr();
    
    if (!dates.includes(todayStr)) {
      dates.push(todayStr);
      saveMilestones(dates);
      updateMilestoneUI();
    }

    // Trigger sharing
    const text = "I'm checking in! I've done my daily recovery work today on Atlas. 🧭";
    if (navigator.share) {
      navigator.share({
        title: 'Atlas Accountability',
        text: text
      }).catch(err => console.log("Share cancelled", err));
    } else {
      // Fallback for desktop/unsupported browsers
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  });

  downloadCertificateBtn.addEventListener("click", () => {
    const total = getMilestones().length;
    
    // Find the highest unlocked badge
    let highest = "1 Day";
    const unlockedBadges = badgeConfigs.filter(b => total >= b.days);
    if (unlockedBadges.length > 0) {
      highest = unlockedBadges[unlockedBadges.length - 1].label;
    }
    
    const profile = JSON.parse(localStorage.getItem("connectaProfileV1")) || {};
    const name = profile.firstName || "Atlas Member";
    
    certNameLine.textContent = name;
    certMilestoneText.textContent = highest;
    certDateLine.textContent = new Date().toLocaleDateString();
    
    window.print();
  });

  // Initial render
  updateMilestoneUI();
});
