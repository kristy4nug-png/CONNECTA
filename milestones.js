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
    const badgeConfigs = [
      { days: 1, label: "1 Day", icon: "🌱", color: "var(--teal)" },
      { days: 7, label: "1 Week", icon: "🔥", color: "var(--amber)" },
      { days: 30, label: "1 Month", icon: "⭐", color: "var(--navy)" }
    ];

    badgesContainer.innerHTML = badgeConfigs.map(b => {
      const unlocked = total >= b.days;
      return `
        <div class="milestone-badge" style="opacity: ${unlocked ? '1' : '0.4'}; filter: ${unlocked ? 'none' : 'grayscale(100%)'}; background: rgba(255,255,255,0.7); border: 2px solid ${unlocked ? b.color : 'var(--line)'}; border-radius: 16px; padding: 16px; text-align: center; width: 100px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">${b.icon}</div>
          <div style="font-size: 0.9rem; font-weight: 900; color: ${b.color};">${b.label}</div>
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
    let highest = "1 Day";
    if (total >= 30) highest = "30 Days";
    else if (total >= 7) highest = "7 Days";
    
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
