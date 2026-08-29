document.addEventListener("DOMContentLoaded", () => {
  const moodBtns = document.querySelectorAll(".mood-btn");
  const moodStatus = document.getElementById("moodStatus");
  const moodChartContainer = document.getElementById("moodChartContainer");
  const moodChartLabels = document.getElementById("moodChartLabels");

  if (!moodChartContainer) return;

  const STORAGE_KEY = "atlasMoodV1";

  const getMoods = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };

  const saveMoods = (moods) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(moods));
  };

  const moodConfig = {
    great: { val: 5, color: "var(--teal)", icon: "🌟", height: "100%" },
    good: { val: 4, color: "var(--teal)", icon: "🙂", height: "80%", opacity: 0.8 },
    okay: { val: 3, color: "var(--amber)", icon: "😐", height: "60%" },
    bad: { val: 2, color: "var(--ruby)", icon: "🌧️", height: "40%", opacity: 0.8 },
    triggered: { val: 1, color: "var(--ruby)", icon: "⚡", height: "20%" }
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const renderChart = () => {
    let moods = getMoods();
    
    // Sort chronologically
    moods.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Keep only last 7 days
    if (moods.length > 7) {
      moods = moods.slice(-7);
    }

    moodChartContainer.innerHTML = "";
    moodChartLabels.innerHTML = "";

    if (moods.length === 0) {
      moodChartContainer.innerHTML = '<div class="empty" style="width:100%; border:none;">Log a mood to see your chart.</div>';
      return;
    }

    moods.forEach(entry => {
      const config = moodConfig[entry.mood];
      if (!config) return;

      const dateObj = new Date(entry.date);
      const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });

      // Chart bar
      const barWrapper = document.createElement("div");
      barWrapper.style.flex = "1";
      barWrapper.style.display = "flex";
      barWrapper.style.flexDirection = "column";
      barWrapper.style.justifyContent = "flex-end";
      barWrapper.style.alignItems = "center";
      barWrapper.style.height = "100%";
      barWrapper.style.minWidth = "30px";

      const iconLabel = document.createElement("div");
      iconLabel.textContent = config.icon;
      iconLabel.style.marginBottom = "4px";
      iconLabel.style.fontSize = "1.2rem";

      const bar = document.createElement("div");
      bar.style.height = config.height;
      bar.style.width = "100%";
      bar.style.backgroundColor = config.color;
      bar.style.opacity = config.opacity || 1;
      bar.style.borderRadius = "4px 4px 0 0";
      bar.style.transition = "height 0.3s ease";

      barWrapper.appendChild(iconLabel);
      barWrapper.appendChild(bar);
      moodChartContainer.appendChild(barWrapper);

      // Label
      const label = document.createElement("div");
      label.style.flex = "1";
      label.style.textAlign = "center";
      label.style.fontSize = "0.75rem";
      label.style.color = "var(--navy)";
      label.style.fontWeight = "bold";
      label.style.minWidth = "30px";
      label.textContent = dayName;
      moodChartLabels.appendChild(label);
    });
  };

  const updateTodayUI = () => {
    const moods = getMoods();
    const todayStr = getTodayStr();
    const todayEntry = moods.find(m => m.date === todayStr);

    if (todayEntry && moodStatus) {
      moodBtns.forEach(btn => {
        if (btn.dataset.mood === todayEntry.mood) {
          btn.style.transform = "scale(1.2)";
          btn.style.opacity = "1";
          btn.style.backgroundColor = "rgba(255,255,255,0.8)";
        } else {
          btn.style.transform = "scale(0.8)";
          btn.style.opacity = "0.5";
          btn.style.backgroundColor = "transparent";
        }
      });
      moodStatus.textContent = "You've checked in today. See your chart on the My Plan tab.";
      moodStatus.style.display = "block";
    }
  };

  moodBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const selectedMood = btn.dataset.mood;
      const todayStr = getTodayStr();
      let moods = getMoods();
      
      // Remove today's entry if it exists to overwrite
      moods = moods.filter(m => m.date !== todayStr);
      
      moods.push({
        date: todayStr,
        mood: selectedMood,
        timestamp: Date.now()
      });
      
      saveMoods(moods);
      updateTodayUI();
      renderChart();
    });
  });

  // Initial render
  updateTodayUI();
  renderChart();
});
