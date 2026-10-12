const KNOWN_FACILITIES = [
  { name: "Parking", icon: "🚗", keywords: ["parking", "park"] },
  { name: "Night Lights", icon: "💡", keywords: ["lights", "floodlights", "lighting"] },
  { name: "Water", icon: "💧", keywords: ["water", "drinking"] },
  { name: "Changing Room", icon: "👥", keywords: ["changing", "shower", "locker"] },
  { name: "Washrooms", icon: "🚻", keywords: ["washroom", "toilet", "restroom"] },
  { name: "Cafeteria", icon: "☕", keywords: ["cafeteria", "snack", "refreshment", "food"] },
  { name: "Spectator Seating", icon: "🛋️", keywords: ["seating", "gallery", "bench", "spectator"] },
];

export function extractFacilities(turf) {
  if (!turf) return [];

  // If turf object has explicit facilities array/string from API
  if (Array.isArray(turf.facilities) && turf.facilities.length > 0) {
    return turf.facilities.map((fac) => {
      if (typeof fac === "string") {
        const match = KNOWN_FACILITIES.find((f) => f.name.toLowerCase() === fac.toLowerCase());
        return match || { name: fac, icon: "⚡" };
      }
      return fac;
    });
  }

  if (typeof turf.facilities === "string" && turf.facilities.trim().length > 0) {
    const list = turf.facilities.split(",").map((s) => s.trim()).filter(Boolean);
    return list.map((fac) => {
      const match = KNOWN_FACILITIES.find((f) => f.name.toLowerCase() === fac.toLowerCase());
      return match || { name: fac, icon: "⚡" };
    });
  }

  // Parse description text if owner wrote facilities in description
  const text = (turf.description || "").toLowerCase();
  if (!text) return [];

  const found = [];
  KNOWN_FACILITIES.forEach((fac) => {
    if (fac.keywords.some((kw) => text.includes(kw))) {
      found.push(fac);
    }
  });

  return found;
}
