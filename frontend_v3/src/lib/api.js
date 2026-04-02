/**
 * Chest X-Ray API client.
 * Talks to a single backend URL defined by VITE_API_URL.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function postImage(url, file, extra = {}) {
  const form = new FormData();
  form.append("image", file);
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  const res = await fetch(url, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Returns a health map: { modelId -> { online: bool, device: string } }
 * Marks all models online only when backend status is "ok" (model fully loaded).
 * Returns all offline if status is "loading" — caller should retry.
 */
export async function fetchAllHealth() {
  const models = ["resnet50", "efficientnet", "convnext", "swin", "raddino", "radjepa"];
  const offline = {};
  models.forEach(id => { offline[id] = { online: false, device: null }; });

  try {
    const data = await fetchHealth();
    if (data.status !== "ok") return offline; // still loading, retry later
    const device = data.device ?? "cpu";
    const online = {};
    models.forEach(id => { online[id] = { online: true, device }; });
    return online;
  } catch {
    return offline;
  }
}

export async function predict(modelId, file) {
  return postImage(`${BASE_URL}/predict`, file);
}

export async function explain(modelId, method, file, opts = {}) {
  return postImage(`${BASE_URL}/explain/${method}`, file, opts);
}

export async function analyzeAll(modelId, file) {
  return postImage(`${BASE_URL}/explain/all`, file);
}
