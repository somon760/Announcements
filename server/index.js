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

async function notifySlack(env, action, wagon, wagons) {
  if (!env.SLACK_WEBHOOK_URL) return;
  const total = Object.values(wagons).reduce((sum, votes) => sum + votes, 0);
  const verb = action === "remove" ? "removed a vote from" : "voted for";
  try {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Caravan vote: someone ${verb} the ${wagon} Wagon. Current tally: ${wagons[wagon]}/4 (${total} total party marks).`
      })
    });
  } catch {
    // Slack notifications are best-effort; never undo a recorded vote.
  }
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
    if (url.pathname === "/api/cult-vote" || url.pathname === "/api/cult-vote/") return vote(request, env);
    return json({ error: "Not found" }, 404);
  }
};
