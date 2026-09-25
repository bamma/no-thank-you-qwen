(() => {
  "use strict";

  // Signatures that identify a Qwen review comment body.
  const QWEN_PATTERNS = [
    /Qwen[\w.-]*\s+PR review/i,          // "🤖 Qwen3-Coder-480B PR review"
    /Qwen review\s*[—–-]\s*Risk:/i,       // "Qwen review — Risk: MEDIUM"
    /\bqwen\.qwen[\w.:-]*/i,              // "qwen.qwen3-coder-480b-a35b-v1:0"
  ];

  const BODY_SELECTOR = ".js-comment-body, .comment-body";
  const CONTAINER_SELECTORS = [
    ".js-timeline-item",
    ".TimelineItem",
    ".js-comment-container",
    ".timeline-comment-group",
  ];

  function isQwenBody(body) {
    const text = body.textContent || "";
    return QWEN_PATTERNS.some((re) => re.test(text));
  }

  function containerFor(body) {
    for (const sel of CONTAINER_SELECTORS) {
      const el = body.closest(sel);
      if (el) return el;
    }
    return null;
  }

  function removeQwen(root) {
    if (!root || !root.querySelectorAll) return 0;
    let removed = 0;
    const bodies = [];
    // The node may be (or sit inside) a comment body that is still being parsed.
    const enclosing = root.closest && root.closest(BODY_SELECTOR);
    if (enclosing) bodies.push(enclosing);
    bodies.push(...root.querySelectorAll(BODY_SELECTOR));
    for (const body of bodies) {
      if (!body.isConnected || !isQwenBody(body)) continue;
      const container = containerFor(body);
      if (container) {
        container.remove();
        removed++;
      }
    }
    return removed;
  }

  function start() {
    // Observe from document_start so comments are removed as they stream in,
    // including GitHub's Turbo navigations and "Load more" timeline expansions.
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) removeQwen(node);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { isQwenBody, removeQwen };
  } else {
    start();
    removeQwen(document);
    document.addEventListener("DOMContentLoaded", () => removeQwen(document), { once: true });
  }
})();
