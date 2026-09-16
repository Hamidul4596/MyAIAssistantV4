# MyAIAssistantV4 Web/PWA

This folder adds a browser-first version without exposing the OpenAI API key.

## Use
1. Deploy the `web` folder with GitHub Pages.
2. Open the Pages URL in Chrome.
3. Enter your deployed backend URL in **Backend URL** and press Save.
4. Use text or Bengali voice input.
5. Use **Install** / browser Add to Home Screen to use it like an app.

## Backend
The existing FastAPI backend exposes `POST /command` and uses `OPENAI_API_KEY` server-side.

Do not put `OPENAI_API_KEY` in `web/app.js`, HTML, or any public GitHub file.

## Important
Android-only package launching is not possible from a normal web page. The web version opens safe web equivalents such as YouTube, Gmail, Maps, WhatsApp Web, Facebook, Instagram and Telegram Web.
