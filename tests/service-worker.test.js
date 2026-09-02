const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = readFileSync(path.join(__dirname, "..", "service-worker.js"), "utf8");

function loadWorker() {
  const listeners = {};
  const cachedResponse = { source: "cache" };
  const context = {
    URL,
    Response: function MockResponse() {},
    fetch: async () => {
      throw new Error("Unexpected network request");
    },
    caches: {
      match: async () => cachedResponse,
      open: async () => ({ addAll: async () => {}, put: async () => {} }),
      keys: async () => [],
      delete: async () => true
    },
    self: {
      location: { origin: "https://atlas.example" },
      addEventListener(name, listener) {
        listeners[name] = listener;
      }
    }
  };

  vm.runInNewContext(source, context, { filename: "service-worker.js" });
  return { listeners, cachedResponse };
}

test("service worker never intercepts cross-origin Supabase requests", () => {
  const { listeners } = loadWorker();
  let intercepted = false;

  listeners.fetch({
    request: {
      method: "GET",
      url: "https://project.supabase.co/rest/v1/atlas_sync"
    },
    respondWith() {
      intercepted = true;
    }
  });

  assert.equal(intercepted, false);
});

test("service worker continues serving same-origin app assets", async () => {
  const { listeners, cachedResponse } = loadWorker();
  let responsePromise;

  listeners.fetch({
    request: {
      method: "GET",
      url: "https://atlas.example/index.html"
    },
    respondWith(promise) {
      responsePromise = promise;
    }
  });

  assert.ok(responsePromise);
  assert.equal(await responsePromise, cachedResponse);
});
