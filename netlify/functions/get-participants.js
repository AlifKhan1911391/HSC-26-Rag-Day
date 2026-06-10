// ═══════════════════════════════════════════════
//   HSC 2026 Rag Day — get-participants.js
//   Netlify Function: GET /api/get-participants
//
//   Returns the full registrations array from
//   data/registrations.json in the GitHub repo.
//
//   Required env var:  GITHUB_TOKEN
// ═══════════════════════════════════════════════

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER        = "AlifKhan1911391";
const REPO         = "HSC-26-Rag-Day";
const FILE_PATH    = "data/registrations.json";
const API_URL      = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN environment variable is not set.");
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Server configuration error." }),
    };
  }

  try {
    const res = await fetch(API_URL, {
      headers: {
        "Authorization": `token ${GITHUB_TOKEN}`,
        "Accept":        "application/vnd.github.v3+json",
        "User-Agent":    "HSC-Rag-Day-Registration",
      },
    });

    // File doesn't exist yet → return empty list
    if (res.status === 404) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify([]),
      };
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to fetch registrations.");
    }

    const fileData     = await res.json();
    const decoded      = Buffer.from(fileData.content, "base64").toString("utf-8");
    const participants = JSON.parse(decoded);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(Array.isArray(participants) ? participants : []),
    };

  } catch (err) {
    console.error("[get-participants] Error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message || "Failed to fetch participants." }),
    };
  }
};
