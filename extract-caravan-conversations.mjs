import fs from "node:fs";

const sourcePath = "/Users/madworks/.codex/attachments/665d4dfe-ee77-44d8-be4a-7a7f7ebc2a36/pasted-text.txt";
const outputPath = new URL("./full-interrogations.js", import.meta.url);
const movie = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const unique = new Map();
const allowedTopicIds = new Set([
  "introduction", "travel", "road-work",
  "animal-abuse", "contraband", "fungus-humongous", "roadside-hospitality", "stranded"
]);

const visit = (value) => {
  if (!value || typeof value !== "object") return;
  if (value.npcName && value.conversation) {
    const existing = unique.get(value.npcName);
    if (!existing) {
      const cloned = structuredClone(value);
      cloned.conversation.topics = cloned.conversation.topics.filter(topic => allowedTopicIds.has(topic.id));
      unique.set(value.npcName, cloned);
    } else {
      const known = new Set(existing.conversation.topics.map(topic => topic.id));
      for (const topic of value.conversation.topics || []) {
        if (!allowedTopicIds.has(topic.id)) continue;
        if (!known.has(topic.id)) {
          existing.conversation.topics.push(topic);
          known.add(topic.id);
        }
      }
    }
  }
  Object.values(value).forEach(visit);
};

visit(movie);

const records = [...unique.values()].map(({ npcName, conversation }) => ({
  name: npcName,
  topics: conversation.topics || [],
  pronouns: conversation.pronouns || {},
  quitMessage: conversation.quitMessage || "",
  contextFallbackMessage: conversation.contextFallbackMessage || "",
  fallbackMessage: conversation.fallbackMessage || ""
}));

const output = `const caravanConversations = ${JSON.stringify(records, null, 2)};\n`;
fs.writeFileSync(outputPath, output);
console.log(`Extracted ${records.length} unique caravan NPC conversations.`);
