/**
 * Chest X-Ray API client.
 * Talks to a single backend URL defined by VITE_API_URL.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || "https://rad14nt-backend.onrender.com").replace(/\/$/, "");

async function postImage(url, file, extra = {}) {
  const form = new FormData();
  form.append("image", file);
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  const res = await fetch(url, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/**
 * GET /health on the backend.
 * Returns { status, model, device } or throws if unreachable.
 */
export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Returns a health map compatible with the existing UI:
 * { modelId -> { online: bool, device: string } }
 * Since we only have one backend, only the active model shows online.
 */
export async function fetchAllHealth() {
  const results = {};
  const models = ["resnet50", "efficientnet", "convnext", "swin", "raddino", "radjepa"];
  models.forEach(id => { results[id] = { online: false, device: null }; });
  try {
    const data = await fetchHealth();
    const activeModel = data.model;
    if (activeModel && results[activeModel] !== undefined) {
      results[activeModel] = { online: true, device: data.device ?? "?" };
    }
  } catch {
    // all remain offline
  }
  return results;
}

/** Run inference. */
export async function predict(modelId, file) {
  return postImage(`${BASE_URL}/predict`, file);
}

/** Run a single explainability method. */
export async function explain(modelId, method, file, opts = {}) {
  return postImage(`${BASE_URL}/explain/${method}`, file, opts);
}

/** Run all explainability methods in one shot (slow). */
export async function analyzeAll(modelId, file) {
  return postImage(`${BASE_URL}/explain/all`, file);
}
