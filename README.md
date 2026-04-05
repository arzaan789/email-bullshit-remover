# Gmail Email Rewriter

A Chrome extension that rewrites Gmail emails to remove unnecessary apologies, excuses for delays, and verbose language — inspired by [Ploum's philosophy on asynchronous communication](https://ploum.net/2026-02-11-do_not_apologize_for_replying_to_my_email.html).

Everything runs **entirely on your device** using an in-browser LLM via [WebLLM](https://github.com/mlc-ai/web-llm). No server, no API keys, no data ever leaves your machine.

## How It Works

1. When you open an email in Gmail, the extension's content script detects it and extracts the subject and body.
2. The email is sent to an **offscreen document** running a local LLM ([Phi-3.5-mini](https://huggingface.co/microsoft/Phi-3.5-mini-instruct)) via WebLLM and WebGPU.
3. The LLM first **checks** whether the email would benefit from rewriting (e.g., contains unnecessary apologies or excessive verbosity).
4. If a rewrite is recommended, the LLM **rewrites** the email to be more concise and direct.
5. The rewritten version is displayed in an **inline banner** directly in Gmail, above the original email.
6. Results are **cached locally** so repeat views of the same email are instant.

> **Note:** The first time you use the extension, the LLM model (~2GB) needs to be downloaded and compiled via WebGPU. This initial load can take a few minutes depending on your internet connection and GPU. Subsequent uses will be much faster as the model is cached by the browser.

## Features

- **Fully on-device** — your emails never leave your machine
- **Zero setup** — no server, no Python, no Ollama, just install the extension
- **In-page rewriting** — rewritten emails appear inline in Gmail
- **Smart checking** — only rewrites emails that actually need it
- **Local caching** — processed emails are cached to avoid redundant LLM calls
- **Force rewrite** — re-run the rewrite with higher creativity if you want a different result
- **Toggle on/off** — use the popup to enable or disable the display

## Requirements

- **Chrome browser** (or Chromium-based browser)
- **WebGPU support** — required for in-browser LLM inference. Most modern GPUs and recent Chrome versions support this. Check at `chrome://gpu`
- **~2GB disk space** for the cached LLM model

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/arzaan789/email-bullshit-remover.git
    cd email-bullshit-remover/my-gmail-rewriter
    ```

2. Install dependencies and build:

    ```bash
    npm install
    npm run build
    ```

3. Load the extension in Chrome:
    - Go to `chrome://extensions`
    - Enable **Developer mode** (toggle in the top-right)
    - Click **Load unpacked**
    - Select the `my-gmail-rewriter` directory

4. (Optional) Pin the extension to your toolbar for easy access.

## Usage

1. Open **Gmail** (`mail.google.com`) in Chrome.
2. Open any email thread.
3. The extension automatically processes the email. You'll see:
    - A **"Checking email..."** indicator while the LLM evaluates the email
    - The **rewritten version** in an inline banner if a rewrite was recommended
    - The **original content** if the LLM determines no rewrite is needed
4. Click **Force Rewrite** in the banner to generate a different rewrite.
5. Use the **extension popup** to toggle the display on or off.

## Project Structure

```
my-gmail-rewriter/
├── manifest.json           # Extension manifest (MV3)
├── background.js           # Service worker: orchestrates LLM calls, caching, messaging
├── content.js              # Injected into Gmail: extracts emails, displays inline banner
├── offscreen.html          # Offscreen document page for WebLLM
├── offscreen.js            # WebLLM engine: runs LLM inference via WebGPU
├── offscreen.bundle.js     # Bundled offscreen.js (built by esbuild)
├── popup.html              # Extension popup UI
├── popup.js                # Popup toggle logic
├── package.json            # npm dependencies and build script
├── esbuild.config.mjs      # esbuild bundler configuration
└── icons/                  # Extension icons
```

## Contributing

Contributions are welcome. Please feel free to open issues or submit pull requests.

## License

MIT License. See `LICENSE` file for details.
