const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync(path.join(__dirname, "../extension/content.js"), "utf8");

function comment(id, author, bodyHtml) {
  return `
<div class="js-timeline-item js-timeline-progressive-focus-container" data-gid="${id}">
  <div class="TimelineItem js-comment-container" data-gid="${id}">
    <div class="timeline-comment-group js-minimizable-comment-group TimelineItem-body" id="issuecomment-${id}">
      <div class="timeline-comment comment js-comment">
        <div class="timeline-comment-header"><strong><a class="author" href="/${author}">${author}</a></strong> commented</div>
        <table><tbody><tr><td class="d-block comment-body markdown-body js-comment-body">${bodyHtml}</td></tr></tbody></table>
      </div>
    </div>
  </div>
</div>`;
}

const QWEN_BODY = `
<p dir="auto">🤖 <strong>Qwen3-Coder-480B PR review</strong> (<a href="#">AN-2538</a> — mirrors the anyday-infra reviewer)</p>
<p dir="auto"><sub>Model: <code class="notranslate">qwen.qwen3-coder-480b-a35b-v1:0</code> via Bedrock eu-north-1</sub></p>
<hr><h2 dir="auto">Qwen review — Risk: MEDIUM</h2>
<p><strong>Summary:</strong> Registers onboardingConfigHeaderInterceptor.</p>`;

const HUMAN_BODY = `<p>LGTM, though I tried qwen locally and it was fine.</p>`;

function page(html) {
  return new JSDOM(`<!doctype html><html><body><div class="js-discussion">${html}</div></body></html>`, {
    runScripts: "outside-only",
  });
}

test("removes Qwen review timeline items and keeps others", () => {
  const dom = page(comment("A", "github-actions", QWEN_BODY) + comment("B", "alice", HUMAN_BODY));
  dom.window.eval(SRC);
  const doc = dom.window.document;
  assert.strictEqual(doc.querySelector('[data-gid="A"]'), null);
  assert.ok(doc.querySelector('[data-gid="B"]'));
  assert.strictEqual(doc.querySelectorAll(".js-timeline-item").length, 1);
});

test("removes Qwen reviews inserted after load", async () => {
  const dom = page(comment("B", "alice", HUMAN_BODY));
  dom.window.eval(SRC);
  const doc = dom.window.document;
  doc.querySelector(".js-discussion").insertAdjacentHTML("beforeend", comment("C", "github-actions", QWEN_BODY));
  await new Promise((r) => setTimeout(r, 0));
  assert.strictEqual(doc.querySelector('[data-gid="C"]'), null);
  assert.ok(doc.querySelector('[data-gid="B"]'));
});

test("removes a Qwen body whose text arrives after the container", async () => {
  const dom = page(comment("D", "github-actions", ""));
  dom.window.eval(SRC);
  const doc = dom.window.document;
  doc.querySelector('[data-gid="D"] .js-comment-body').insertAdjacentHTML("beforeend", QWEN_BODY);
  await new Promise((r) => setTimeout(r, 0));
  assert.strictEqual(doc.querySelector('[data-gid="D"]'), null);
});
