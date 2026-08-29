document.addEventListener("DOMContentLoaded", () => {
  const findNeedsBtn = document.getElementById("findNeeds");
  const needsStatus = document.getElementById("needsStatus");
  const needsResults = document.getElementById("needsResults");
  const searchNeedsPlaceBtn = document.getElementById("searchNeedsPlace");

  if (!findNeedsBtn) return;

  const distanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getTagsQuery = (type) => {
    if (type === "food_bank") return `nwr["social_facility"="food_bank"](around:{radius},{lat},{lon}); nwr["amenity"="food_bank"](around:{radius},{lat},{lon});`;
    if (type === "shelter") return `nwr["social_facility"="shelter"](around:{radius},{lat},{lon}); nwr["amenity"="shelter"](around:{radius},{lat},{lon});`;
    if (type === "soup_kitchen") return `nwr["social_facility"="soup_kitchen"](around:{radius},{lat},{lon}); nwr["amenity"="soup_kitchen"](around:{radius},{lat},{lon});`;
    return "";
  };

  const formatAddress = (tags) => {
    const parts = [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:city"],
      tags["addr:postcode"]
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  };

  const queryNeeds = async (lat, lon, radius, type) => {
    const tagsQuery = getTagsQuery(type).replace(/{radius}/g, radius).replace(/{lat}/g, lat).replace(/{lon}/g, lon);
    const query = `[out:json][timeout:25];( ${tagsQuery} );out center tags;`;
    
    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter"
    ];
    let lastError;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`Map service returned ${response.status}`);
        return await response.json();
      } catch (error) { lastError = error; }
    }
    throw lastError || new Error("Map service is unavailable");
  };

  const renderResults = (results, lat, lon) => {
    needsResults.innerHTML = "";
    if (!results.length) {
      needsResults.innerHTML = '<div class="empty">No facilities found within this distance. Try increasing the search distance or checking a different area.</div>';
      return;
    }

    results.forEach(item => {
      const card = document.createElement("div");
      card.className = "cafe"; // Reusing cafe styling (frosted glass box)
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.gap = "8px";

      const gmapsLink = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lon}&destination=${item.lat},${item.lon}`;

      card.innerHTML = `
        <div style="display:flex; justify-content: space-between; align-items: start;">
          <strong style="font-size: 1.1rem; color: var(--navy);">${item.name}</strong>
          <span class="pill" style="background:var(--teal); color:white;">${item.distance.toFixed(1)} km</span>
        </div>
        ${item.address ? `<div style="font-size: 0.9rem;">📍 ${item.address}</div>` : ''}
        ${item.opening ? `<div style="font-size: 0.9rem;">🕒 ${item.opening}</div>` : ''}
        ${item.contact ? `<div style="font-size: 0.9rem;">📞 ${item.contact}</div>` : ''}
        ${item.website ? `<div style="font-size: 0.9rem;">🌐 <a href="${item.website}" target="_blank">Website</a></div>` : ''}
        <div class="action-row" style="margin-top: 8px;">
          <a class="primary" href="${gmapsLink}" target="_blank" rel="noopener" style="text-align: center; width: 100%;">Get Directions</a>
        </div>
      `;
      needsResults.appendChild(card);
    });
  };

  findNeedsBtn.onclick = () => {
    if (!navigator.geolocation) {
      needsStatus.textContent = "This browser cannot provide a location. Use the town or postcode search below.";
      return;
    }
    
    findNeedsBtn.disabled = true;
    needsStatus.textContent = "Requesting your location…";
    needsResults.innerHTML = "";
    
    navigator.geolocation.getCurrentPosition(async position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const radius = Number(document.getElementById("needsRadius").value);
      const type = document.getElementById("needsType").value;
      const typeName = document.getElementById("needsType").options[document.getElementById("needsType").selectedIndex].text;

      needsStatus.textContent = `Searching for ${typeName.toLowerCase()} on the community map…`;
      
      try {
        const data = await queryNeeds(lat, lon, radius, type);
        const results = (data.elements || []).map(item => {
          const itemLat = item.lat ?? item.center?.lat;
          const itemLon = item.lon ?? item.center?.lon;
          if (!Number.isFinite(itemLat) || !Number.isFinite(itemLon)) return null;
          
          const tags = item.tags || {};
          return {
            name: tags.name || tags.brand || `Unnamed ${typeName}`,
            lat: itemLat,
            lon: itemLon,
            distance: distanceKm(lat, lon, itemLat, itemLon),
            address: formatAddress(tags),
            opening: tags.opening_hours || "",
            contact: tags.phone || tags["contact:phone"] || "",
            website: tags.website || tags["contact:website"] || ""
          };
        }).filter(Boolean).sort((a, b) => a.distance - b.distance);
        
        needsStatus.textContent = `Found ${results.length} mapped ${typeName.toLowerCase()} within ${radius/1000} km.`;
        renderResults(results, lat, lon);
      } catch (error) {
        needsStatus.textContent = "The live map search could not connect. Use the town or postcode search instead.";
        needsResults.innerHTML = '<div class="empty">Locator is temporarily unavailable.</div>';
      } finally {
        findNeedsBtn.disabled = false;
      }
    }, error => {
      const messages = {
        1: "Location permission was declined. Use the town or postcode search below.",
        2: "Your location could not be determined. Try again or search by postcode.",
        3: "The location request timed out. Try again or search by postcode."
      };
      needsStatus.textContent = messages[error.code] || "Location could not be used.";
      findNeedsBtn.disabled = false;
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  };

  searchNeedsPlaceBtn.onclick = () => {
    const place = document.getElementById("needsPlace").value.trim();
    const typeName = document.getElementById("needsType").options[document.getElementById("needsType").selectedIndex].text;
    
    if (!place) {
      needsStatus.textContent = "Enter a town or postcode first.";
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${typeName.toLowerCase()} near ${place}`)}`;
    window.open(url, "_blank", "noopener");
  };
});
