# ClearPaste

Paste a confusing document. Get it in plain words.

ClearPaste turns government notices, hospital discharge papers, bank letters and legal agreements into something anyone can act on:

- **In short**: what the document means for you, in a few sentences
- **What you need to do**: a tick-off checklist of steps
- **Dates and deadlines**, **Money**, **Documents to keep ready**, **Medicines**, **Who to contact** (tap to call or email)
- **Be careful**: what happens if you do nothing
- **The whole document in plain words**, with every changed phrase highlighted (hover to see the original)
- **Hard words explained**
- A **reading-level meter** showing how much easier the new version is
- **Read aloud** at slow, normal or fast speed
- Bigger text, an easy-read font with wider spacing, and high contrast
- Copy, download or print the result to share with family

Built for the [Ctrl+V Hackathon](https://ctrl-v-hackathon-31831.devpost.com/).

## Run it

No install and no build step. Open `index.html` in Chrome, Edge or Firefox.

To serve it locally instead:

```
python -m http.server 8000
```

Then open http://localhost:8000.

To deploy it, upload the folder to any static host (GitHub Pages, Netlify, Vercel).

Demo links that load an example straight away:

- `index.html#sample=scholarship`
- `index.html#sample=discharge`
- `index.html#sample=bank`

## Two modes

| | Offline (default) | AI (Gemini) |
|---|---|---|
| Needs internet or an account | No | Yes, a free Gemini API key |
| Privacy | Text never leaves the device | Text is sent to Google's Gemini API |
| Output language | English | 17 languages, including Hindi, Bengali, Tamil, Telugu, Marathi and Urdu |
| How it works | Over 250 rules that replace legal, government, banking and medical phrases, split long sentences, and pick out dates, amounts, documents, medicines and contacts | Structured JSON output from Gemini using a strict schema and a prompt that forbids adding facts |

If an AI request fails, the app falls back to the offline result automatically.

The API key is entered in **Settings**, stored only in the browser's `localStorage`, and sent only to `generativelanguage.googleapis.com`. Get a key at https://aistudio.google.com/apikey. The model name can be changed in Settings (default `gemini-3.8-flash`).

## Project structure

```
index.html        Page layout
css/style.css     Styles, high-contrast and easy-read themes, print layout
js/engine.js      Offline plain-language engine and readability score
js/ai.js          Optional Gemini client
js/samples.js     Example documents (made up)
js/app.js         UI: paste handling, rendering, read aloud, export, settings
```

## Accessibility

- Works fully with a keyboard. Has a skip link, visible focus and labelled controls.
- Status messages are announced to screen readers.
- Respects "reduce motion".
- Ctrl+V anywhere on the page pastes and explains in one step.

## Limits

- Offline mode is rule based. It simplifies common official wording well but does not understand meaning the way the AI mode does.
- The reading-level score (Flesch-Kincaid) only works for English.
- Read aloud uses the voices installed on the device. Some Indian-language voices may be missing.
- ClearPaste is not legal, medical or financial advice.

## Tech

HTML, CSS, vanilla JavaScript, Web Speech API, Clipboard API, Google Gemini API (optional).
