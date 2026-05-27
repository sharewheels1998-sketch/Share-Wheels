import { useCallback, useEffect, useState } from "react";
import { getActiveLocations } from "../ApiService/locationsApiService";

const FALLBACK_LOCATIONS = [
  "Hyderabad",
  "Vijayawada",
  "Bhimavaram",
  "Visakhapatnam",
  "Bangalore",
  "Chennai",
];

let cachedLocations = null;
let cachePromise = null;

const loadLocations = async () => {
  if (cachedLocations) return cachedLocations;
  if (!cachePromise) {
    cachePromise = getActiveLocations()
      .then((list) => {
        cachedLocations =
          Array.isArray(list) && list.length > 0 ? list : FALLBACK_LOCATIONS;
        return cachedLocations;
      })
      .catch(() => {
        cachedLocations = FALLBACK_LOCATIONS;
        return cachedLocations;
      })
      .finally(() => {
        cachePromise = null;
      });
  }
  return cachePromise;
};

export const refreshLocationSuggestions = () => {
  cachedLocations = null;
  cachePromise = null;
};

export const useLocationSuggestions = () => {
  const [locations, setLocations] = useState(cachedLocations || []);
  const [loading, setLoading] = useState(!cachedLocations);

  const reload = useCallback(async (force = false) => {
    if (force) refreshLocationSuggestions();
    setLoading(true);
    try {
      const list = await loadLocations();
      setLocations(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload(false);
  }, [reload]);

  const filterLocations = useCallback(
    (text) => {
      const query = String(text || "").trim().toLowerCase();
      if (!query) return [];
      return locations.filter((item) => item.toLowerCase().includes(query));
    },
    [locations]
  );

  return { locations, loading, filterLocations, reload };
};
