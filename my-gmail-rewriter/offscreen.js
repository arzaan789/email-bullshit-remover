import * as webllm from "@mlc-ai/web-llm";

const MODEL_ID = "Phi-3.5-mini-instruct-q4f16_1-MLC";

let engine = null;
let enginePromise = null;

const CHECK_SYSTEM_PROMPT = `You are an AI assistant evaluating an email. Determine if it would benefit from rewriting.
Look for:
- Unnecessary apologies or excuses for delays
- Promises to reply later without action
- Excessive verbosity that could be shortened

Respond with ONLY "YES" or "NO". No other text.`;

const REWRITE_SYSTEM_PROMPT = `You are an expert email assistant. Rewrite the given email to:
- Remove apologies and excuses for delay
- Convey the main message concisely

Respond ONLY in this format:
Subject: <subject>
Content: <content>`;

async function getEngine() {
  if (engine) return engine;
  if (enginePromise) return enginePromise;

  enginePromise = webllm.CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (progress) => {
      console.log(`WebLLM loading: ${progress.text}`);
    },
  });

  engine = await enginePromise;
  enginePromise = null;
  return engine;
}

async function runCheck(subject, content) {
  const eng = await getEngine();
  await eng.resetChat();
  const reply = await eng.chat.completions.create({
    messages: [
      { role: "system", content: CHECK_SYSTEM_PROMPT },
      { role: "user", content: `Subject: ${subject}\nContent: ${content}` },
    ],
    max_tokens: 10,
    temperature: 0,
  });

  const answer = reply.choices[0].message.content.trim().toUpperCase();
  const rewriteRecommended = answer.startsWith("YES");

  return {
    rewrite_recommended: rewriteRecommended,
    reason: rewriteRecommended
      ? "LLM recommended rewrite based on Ploum's principles."
      : "LLM found no immediate need for rewrite based on Ploum's principles.",
  };
}

async function runRewrite(subject, content, forceRewrite = false) {
  const eng = await getEngine();
  await eng.resetChat();
  const reply = await eng.chat.completions.create({
    messages: [
      { role: "system", content: REWRITE_SYSTEM_PROMPT },
      { role: "user", content: `Subject: ${subject}\nContent: ${content}` },
    ],
    max_tokens: 500,
    temperature: forceRewrite ? 0.7 : 0.3,
  });

  const response = reply.choices[0].message.content.trim();

  // Parse Subject: and Content: from response
  const subjectMatch = response.match(/^Subject:\s*(.*)/im);
  const contentMatch = response.match(/^Content:\s*/im);

  const rewrittenSubject = subjectMatch ? subjectMatch[1].trim() : subject;
  const rewrittenContent = contentMatch
    ? response.slice(contentMatch.index + contentMatch[0].length).trim()
    : response;

  return {
    rewritten_subject: rewrittenSubject,
    rewritten_content: rewrittenContent,
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.target !== "offscreen") return;

  if (request.action === "check") {
    runCheck(request.subject, request.content)
      .then(sendResponse)
      .catch((err) => {
        console.error("Offscreen check error:", err);
        sendResponse({
          rewrite_recommended: true,
          reason: `Check failed: ${err.message}`,
        });
      });
    return true; // Keep sendResponse alive for async
  }

  if (request.action === "rewrite") {
    runRewrite(request.subject, request.content, request.forceRewrite || false)
      .then(sendResponse)
      .catch((err) => {
        console.error("Offscreen rewrite error:", err);
        sendResponse({
          rewritten_subject: "[Rewrite Error]",
          rewritten_content: `Failed to rewrite: ${err.message}`,
        });
      });
    return true;
  }
});
