// ═══════════════════════════════════════════════
//   HSC 2026 Rag Day — register.js
//   Netlify Function: POST /api/register
//
//   Reads registrations.json from GitHub,
//   appends the new entry, and writes it back.
//
//   Required env var:  GITHUB_TOKEN
// ═══════════════════════════════════════════════

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER        = "AlifKhan1911391";
const REPO         = "HSC-26-Rag-Day";
const FILE_PATH    = "data/registrations.json";
const API_URL      = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

const VALID_SECTIONS = ["A", "B", "C", "D"];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function ghHeaders() {
  return {
    "Authorization": `token ${GITHUB_TOKEN}`,
    "Accept":        "application/vnd.github.v3+json",
    "Content-Type":  "application/json",
    "User-Agent":    "HSC-Rag-Day-Registration",
  };
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  // Only accept POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // ── Check token is configured ──
  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN environment variable is not set.");
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Server configuration error. Contact the admin." }),
    };
  }

  try {
    // ── Parse & sanitise input ──
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Invalid request body." }),
      };
    }

    const name    = (body.name    || "").trim();
    const serial  = (body.serial  || "").toString().trim();
    const section = (body.section || "").trim().toUpperCase();

    if (!name || !serial || !section) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "All fields (name, serial, section) are required." }),
      };
    }
    if (!VALID_SECTIONS.includes(section)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Section must be A, B, C, or D." }),
      };
    }

    // ── Read current file from GitHub ──
    let registrations = [];
    let sha = null;

    const getRes = await fetch(API_URL, { headers: ghHeaders() });

    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      const decoded = Buffer.from(fileData.content, "base64").toString("utf-8");
      registrations = JSON.parse(decoded);
    } else if (getRes.status === 404) {
      // File doesn't exist yet — will be created on first registration
      registrations = [];
    } else {
      const errData = await getRes.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to read registrations file from GitHub.");
    }

    // ── Check for duplicate serial number ──
    const duplicate = registrations.find(
      (r) => r.serial.toString().trim() === serial
    );
    if (duplicate) {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: `Serial number ${serial} is already registered. Each student can register only once.`,
        }),
      };
    }

    // ── Append new registration ──
    registrations.push({
      id:           Date.now(),
      name,
      serial,
      section,
      registeredAt: new Date().toISOString(),
    });

    // ── Write updated file back to GitHub ──
    const putPayload = {
      message: `Register: ${name} — Section ${section}, Serial #${serial}`,
      content: Buffer.from(JSON.stringify(registrations, null, 2)).toString("base64"),
    };
    if (sha) putPayload.sha = sha;

    const putRes = await fetch(API_URL, {
      method:  "PUT",
      headers: ghHeaders(),
      body:    JSON.stringify(putPayload),
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to save registration to GitHub.");
    }

    // ── Success ──
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: `Registration successful! Welcome, ${name}! 🎉`,
      }),
    };

  } catch (err) {
    console.error("[register] Error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: err.message || "An unexpected error occurred. Please try again.",
      }),
    };
  }
};
