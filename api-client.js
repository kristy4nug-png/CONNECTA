(function initialiseAtlasSupabase(global, document) {
  "use strict";

  const SUPABASE_CDN_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  const SUPABASE_URL = "https://pczvxmvqsnzjgkizzbfe.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_Yen753dC1sJM5qpiOX4iZw_qaUGhHdH";
  const SYNC_KEYS = Object.freeze([
    "atlasContactsV1",
    "atlasJournalV1",
    "atlasMoodV1",
    "atlasMilestonesV1",
    "connectaSafetyPlanV1",
    "atlasReflectionsV1",
    "connectaProfileV1"
  ]);

  const suppliedConfig = global.ATLAS_SUPABASE_CONFIG || {};
  const config = Object.freeze({
    url: String(suppliedConfig.url || SUPABASE_URL),
    anonKey: String(suppliedConfig.anonKey || SUPABASE_ANON_KEY)
  });

  let libraryPromise;
  let clientPromise;

  function isConfigured() {
    return /^https:\/\/.+\.supabase\.co\/?$/i.test(config.url)
      && config.anonKey.length > 20
      && !config.anonKey.includes("PASTE_YOUR_");
  }

  function configurationError() {
    return new Error(
      "Supabase is not configured yet. Add the project URL and public anon key at the top of api-client.js."
    );
  }

  function loadSupabaseLibrary() {
    if (global.supabase && typeof global.supabase.createClient === "function") {
      return Promise.resolve(global.supabase);
    }

    if (libraryPromise) return libraryPromise;

    libraryPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${SUPABASE_CDN_URL}"]`);
      const script = existingScript || document.createElement("script");

      const handleLoad = () => {
        if (global.supabase && typeof global.supabase.createClient === "function") {
          resolve(global.supabase);
        } else {
          libraryPromise = undefined;
          reject(new Error("The Supabase client loaded without exposing createClient()."));
        }
      };

      const handleError = () => {
        if (script.dataset.atlasSupabaseClient === "true") script.remove();
        libraryPromise = undefined;
        reject(new Error("Could not load the Supabase client. Check your internet connection and try again."));
      };

      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });

      if (!existingScript) {
        script.src = SUPABASE_CDN_URL;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.dataset.atlasSupabaseClient = "true";
        (document.head || document.documentElement).appendChild(script);
      }
    });

    return libraryPromise;
  }

  function getClient() {
    if (!isConfigured()) return Promise.reject(configurationError());

    if (!clientPromise) {
      clientPromise = loadSupabaseLibrary()
        .then((supabaseLibrary) => (
          supabaseLibrary.createClient(config.url, config.anonKey, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true
            }
          })
        ))
        .catch((error) => {
          clientPromise = undefined;
          throw error;
        });
    }

    return clientPromise;
  }

  async function requireUser() {
    const user = await SupabaseClient.getUser();
    if (!user) throw new Error("Sign in to Atlas Cloud before syncing data.");
    return user;
  }

  const SupabaseClient = Object.freeze({
    isConfigured,

    async isLoggedIn() {
      const client = await getClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return Boolean(data && data.session);
    },

    async getUser() {
      const client = await getClient();
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData || !sessionData.session) return null;

      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      return data && data.user ? data.user : null;
    },

    async signUp(email, password) {
      const client = await getClient();
      const { data, error } = await client.auth.signUp({
        email: String(email || "").trim(),
        password
      });
      if (error) throw error;
      return data;
    },

    async signIn(email, password) {
      const client = await getClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: String(email || "").trim(),
        password
      });
      if (error) throw error;
      return data;
    },

    async signOut() {
      const client = await getClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },

    async syncPush() {
      const client = await getClient();
      const user = await requireUser();
      const updatedAt = new Date().toISOString();
      const rows = SYNC_KEYS.map((key) => ({
        user_id: user.id,
        key,
        value: global.localStorage.getItem(key) ?? "null",
        updated_at: updatedAt
      }));

      const { error } = await client
        .from("atlas_sync")
        .upsert(rows, { onConflict: "user_id,key" });

      if (error) throw error;
      return { count: rows.length, updatedAt };
    },

    async syncPull() {
      const client = await getClient();
      const user = await requireUser();
      const { data, error } = await client
        .from("atlas_sync")
        .select("key,value")
        .eq("user_id", user.id);

      if (error) throw error;

      (data || []).forEach((row) => {
        global.localStorage.setItem(row.key, row.value);
      });

      global.location.reload();
      return { count: (data || []).length };
    }
  });

  global.SupabaseClient = SupabaseClient;

  if (isConfigured()) {
    // Begin the CDN request immediately. Public methods still wait for it safely.
    loadSupabaseLibrary().catch(() => {
      // Public methods surface a useful error if cloud functionality is used.
    });
  }
})(window, document);
