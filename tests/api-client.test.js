const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = readFileSync(path.join(__dirname, "..", "api-client.js"), "utf8");

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
    value(key) {
      return values.get(key);
    }
  };
}

function loadClient({ initialStorage = {}, pullRows = [] } = {}) {
  const calls = {
    createClient: [],
    signUp: [],
    signIn: [],
    signOut: 0,
    from: [],
    upsert: [],
    select: [],
    eq: [],
    reload: 0
  };
  const storage = memoryStorage(initialStorage);
  const user = { id: "user-123", email: "person@example.com" };

  const table = {
    upsert(rows, options) {
      calls.upsert.push({ rows, options });
      return Promise.resolve({ error: null });
    },
    select(columns) {
      calls.select.push(columns);
      return {
        eq(column, value) {
          calls.eq.push({ column, value });
          return Promise.resolve({ data: pullRows, error: null });
        }
      };
    }
  };

  const supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: { user } }, error: null }),
      getUser: async () => ({ data: { user }, error: null }),
      signUp: async (credentials) => {
        calls.signUp.push(credentials);
        return { data: { user, session: null }, error: null };
      },
      signInWithPassword: async (credentials) => {
        calls.signIn.push(credentials);
        return { data: { user, session: { user } }, error: null };
      },
      signOut: async () => {
        calls.signOut += 1;
        return { error: null };
      }
    },
    from(name) {
      calls.from.push(name);
      return table;
    }
  };

  const window = {
    ATLAS_SUPABASE_CONFIG: {
      url: "https://example.supabase.co",
      anonKey: "public-anon-key-for-unit-testing-only"
    },
    localStorage: storage,
    location: {
      reload() {
        calls.reload += 1;
      }
    },
    supabase: {
      createClient(...args) {
        calls.createClient.push(args);
        return supabaseClient;
      }
    }
  };

  vm.runInNewContext(source, { window, document: {} }, { filename: "api-client.js" });
  return { client: window.SupabaseClient, calls, storage, user };
}

test("SupabaseClient exposes authentication methods backed by supabase-js", async () => {
  const { client, calls, user } = loadClient();

  assert.equal(client.isConfigured(), true);
  assert.equal(await client.isLoggedIn(), true);
  assert.deepEqual(await client.getUser(), user);

  await client.signUp("  person@example.com ", "password1");
  await client.signIn("  person@example.com ", "password1");
  await client.signOut();

  assert.equal(calls.signUp[0].email, "person@example.com");
  assert.equal(calls.signUp[0].password, "password1");
  assert.equal(calls.signIn[0].email, "person@example.com");
  assert.equal(calls.signIn[0].password, "password1");
  assert.equal(calls.signOut, 1);
  assert.equal(calls.createClient.length, 1);
});

test("syncPush upserts all seven supported localStorage records", async () => {
  const { client, calls } = loadClient({
    initialStorage: {
      atlasContactsV1: '[{"name":"Sam"}]',
      atlasJournalV1: '[{"text":"Today"}]'
    }
  });

  const result = await client.syncPush();
  const { rows, options } = calls.upsert[0];

  assert.equal(result.count, 7);
  assert.equal(calls.from[0], "atlas_sync");
  assert.equal(options.onConflict, "user_id,key");
  assert.deepEqual(
    Array.from(rows, (row) => row.key),
    [
      "atlasContactsV1",
      "atlasJournalV1",
      "atlasMoodV1",
      "atlasMilestonesV1",
      "connectaSafetyPlanV1",
      "atlasReflectionsV1",
      "connectaProfileV1"
    ]
  );
  assert.equal(rows[0].value, '[{"name":"Sam"}]');
  assert.equal(rows[2].value, "null");
  assert.ok(rows.every((row) => row.user_id === "user-123"));
  assert.ok(rows.every((row) => row.updated_at === rows[0].updated_at));
});

test("syncPull writes cloud values to localStorage and reloads Atlas", async () => {
  const { client, calls, storage } = loadClient({
    pullRows: [
      { key: "atlasMoodV1", value: '[{"mood":"good"}]' },
      { key: "connectaSafetyPlanV1", value: '{"warningSigns":"alone"}' }
    ]
  });

  const result = await client.syncPull();

  assert.equal(result.count, 2);
  assert.equal(calls.select[0], "key,value");
  assert.deepEqual(calls.eq[0], { column: "user_id", value: "user-123" });
  assert.equal(storage.value("atlasMoodV1"), '[{"mood":"good"}]');
  assert.equal(storage.value("connectaSafetyPlanV1"), '{"warningSigns":"alone"}');
  assert.equal(calls.reload, 1);
});

test("api-client loads the required Supabase v2 UMD bundle from jsDelivr", () => {
  let appendedScript;
  const script = {
    dataset: {},
    addEventListener() {}
  };
  const document = {
    querySelector: () => null,
    createElement: () => script,
    head: {
      appendChild(value) {
        appendedScript = value;
      }
    }
  };
  const window = {
    ATLAS_SUPABASE_CONFIG: {
      url: "https://example.supabase.co",
      anonKey: "public-anon-key-for-unit-testing-only"
    },
    localStorage: memoryStorage(),
    location: { reload() {} }
  };

  vm.runInNewContext(source, { window, document }, { filename: "api-client.js" });

  assert.equal(
    appendedScript.src,
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"
  );
  assert.equal(typeof window.SupabaseClient.syncPush, "function");
});

test("invalid credentials fail clearly without contacting the CDN", async () => {
  const window = {
    ATLAS_SUPABASE_CONFIG: {
      url: "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE",
      anonKey: "PASTE_YOUR_SUPABASE_ANON_KEY_HERE"
    },
    localStorage: memoryStorage(),
    location: { reload() {} }
  };

  vm.runInNewContext(source, { window, document: {} }, { filename: "api-client.js" });

  assert.equal(window.SupabaseClient.isConfigured(), false);
  await assert.rejects(
    window.SupabaseClient.isLoggedIn(),
    /Supabase is not configured yet/
  );
});
