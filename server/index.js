const VOTE_WAGONS = ["Green", "Red", "Yellow", "Golden", "Purple", "Black", "Copper"];
const emptyTally = () => Object.fromEntries(VOTE_WAGONS.map(wagon => [wagon, 0]));

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

async function tally(env) {
  const result = await env.DB.prepare("SELECT wagon, votes FROM cult_wagon_votes").all();
  const wagons = emptyTally();
  for (const row of result.results || []) {
    if (row.wagon in wagons) wagons[row.wagon] = Math.min(4, Number(row.votes) || 0);
  }
  return wagons;
}

function slackBlocks(wagons, summary = "Cast a vote from Slack or use the research site.") {
  const toggleButtons = VOTE_WAGONS.map(wagon => ({
    type: "button",
    text: { type: "plain_text", text: `Toggle ${wagon}`, emoji: true },
    action_id: `vote_toggle_${wagon}`,
    value: wagon
  }));
  const tally = VOTE_WAGONS.map(wagon => `*${wagon}*: ${wagons[wagon]}/4`).join("   ");
  return [
    { type: "section", text: { type: "mrkdwn", text: `*Caravan cult-wagon vote*\n${summary}` } },
    { type: "section", text: { type: "mrkdwn", text: tally } },
    { type: "context", elements: [{ type: "mrkdwn", text: "Toggle your vote for a wagon. Your Slack vote is tracked privately." }] },
    { type: "actions", elements: toggleButtons.slice(0, 4) },
    { type: "actions", elements: toggleButtons.slice(4) }
  ];
}

function slackPayload(wagons, summary) {
  return { text: summary, blocks: slackBlocks(wagons, summary) };
}

async function notifySlack(env, action, wagon, wagons) {
  if (!env.SLACK_WEBHOOK_URL) return;
  const total = Object.values(wagons).reduce((sum, votes) => sum + votes, 0);
  const verb = action === "remove" ? "removed a vote from" : "voted for";
  const summary = `Someone ${verb} the ${wagon} Wagon. Current tally: ${wagons[wagon]}/4 (${total} total party marks).`;
  try {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload(wagons, `Caravan vote: ${summary}`))
    });
  } catch {
    // Slack notifications are best-effort; never undo a recorded vote.
  }
}

async function verifySlackRequest(request, rawBody, env) {
  if (!env.SLACK_SIGNING_SECRET) return false;
  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.SLACK_SIGNING_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`v0:${timestamp}:${rawBody}`));
  const expected = `v0=${[...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("")}`;
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return mismatch === 0;
}

async function slackInteraction(request, env) {
  const rawBody = await request.text();
  if (!(await verifySlackRequest(request, rawBody, env))) return json({ error: "Unauthorized" }, 401);
  const payload = JSON.parse(new URLSearchParams(rawBody).get("payload") || "{}");
  const action = payload.actions?.[0];
  const match = /^vote_toggle_(Green|Red|Yellow|Golden|Purple|Black|Copper)$/.exec(action?.action_id || "");
  if (!match) return json({ error: "Unknown vote action" }, 400);

  const wagon = match[1];
  const userId = payload.user?.id;
  if (!userId) return json({ error: "Missing Slack user" }, 400);
  const existing = await env.DB.prepare("SELECT 1 FROM slack_wagon_votes WHERE user_id = ? AND wagon = ?").bind(userId, wagon).first();
  let voteAction;
  if (existing) {
    await env.DB.prepare("DELETE FROM slack_wagon_votes WHERE user_id = ? AND wagon = ?").bind(userId, wagon).run();
    await env.DB.prepare("UPDATE cult_wagon_votes SET votes = MAX(votes - 1, 0) WHERE wagon = ?").bind(wagon).run();
    voteAction = "removed a vote from";
  } else {
    const current = await tally(env);
    if (current[wagon] < 4) {
      await env.DB.prepare("INSERT INTO slack_wagon_votes (user_id, wagon) VALUES (?, ?)").bind(userId, wagon).run();
      await env.DB.prepare("INSERT INTO cult_wagon_votes (wagon, votes) VALUES (?, 1) ON CONFLICT(wagon) DO UPDATE SET votes = MIN(votes + 1, 4)").bind(wagon).run();
      voteAction = "voted for";
    } else {
      voteAction = "tried to vote for";
    }
  }
  const wagons = await tally(env);
  const summary = `${payload.user?.name || "Someone"} ${voteAction} the ${wagon} Wagon.`;
  if (payload.response_url) {
    await fetch(payload.response_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...slackPayload(wagons, summary), replace_original: true })
    });
  }
  return new Response(null, { status: 200 });
}

async function vote(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" } });
  if (request.method === "GET") return json({ wagons: await tally(env) });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid vote" }, 400); }
  if (!VOTE_WAGONS.includes(body?.wagon)) return json({ error: "That wagon is not available for voting" }, 400);

  if (body.action === "remove") {
    await env.DB.prepare("UPDATE cult_wagon_votes SET votes = MAX(votes - 1, 0) WHERE wagon = ?").bind(body.wagon).run();
  } else {
    await env.DB.prepare("INSERT INTO cult_wagon_votes (wagon, votes) VALUES (?, 1) ON CONFLICT(wagon) DO UPDATE SET votes = MIN(votes + 1, 4)").bind(body.wagon).run();
  }
  const wagons = await tally(env);
  await notifySlack(env, body.action, body.wagon, wagons);
  return json({ wagons });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/slack/interactions" && request.method === "POST") return slackInteraction(request, env);
    if (url.pathname === "/api/cult-vote" || url.pathname === "/api/cult-vote/") return vote(request, env);
    return json({ error: "Not found" }, 404);
  }
};
