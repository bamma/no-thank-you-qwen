# No Thank You, Qwen

Chrome extension that removes Qwen AI review comments from GitHub pull request timelines.

A comment is removed when its body matches one of these signatures:

- `Qwen… PR review` (e.g. "🤖 **Qwen3-Coder-480B PR review**")
- `Qwen review — Risk:` heading
- a `qwen.qwen…` model id (e.g. `qwen.qwen3-coder-480b-a35b-v1:0`)

The whole timeline item (avatar, header, body, reactions) is removed. A `MutationObserver`
also catches comments added later: Turbo navigation, "Load more" and live updates.
A passing mention of "qwen" in a human comment is left alone.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select the `extension/` folder.
3. Open or reload a GitHub PR.

## Development

```sh
npm install
npm test
```

To change what counts as a Qwen review, edit `QWEN_PATTERNS` in `extension/content.js`.
