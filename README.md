# 📺 TubeMeta — YouTube Video Metadata & Thumbnail Analyzer

**TubeMeta** is a free, 100% client-side web tool that lets you instantly analyze any YouTube video URL to extract public metadata and download high-resolution thumbnails. No API keys, no signups, no server — everything runs directly in your browser.

🔗 **[Live Demo →](https://tubemeta.netlify.app/)**

---

## ✨ Features

### 🔗 Smart URL Parser
Accepts **any** YouTube URL format and reliably extracts the 11-character video ID:
- `youtube.com/watch?v=ID`
- `youtu.be/ID`
- `youtube.com/shorts/ID`
- `youtube.com/live/ID`
- `youtube.com/embed/ID`
- `m.youtube.com/watch?v=ID`
- URLs with playlist parameters, timestamps, and extra query strings

### 📋 Video Metadata Card
Fetches and displays public metadata via YouTube's official [oEmbed endpoint](https://oembed.com/) — no API key required:
- **Video Title**
- **Channel / Author Name** (clickable link to channel)
- **Direct Video URL**
- **Thumbnail Preview**

### 🖼️ Thumbnail Suite
Displays **all available thumbnail qualities** in a responsive grid:

| Quality | Resolution | Filename |
|---------|-----------|----------|
| Maximum HD | 1280×720 | `maxresdefault.jpg` |
| Standard | 640×480 | `sddefault.jpg` |
| High Quality | 480×360 | `hqdefault.jpg` |
| Medium | 320×180 | `mqdefault.jpg` |
| Small | 120×90 | `default.jpg` |

Each thumbnail includes:
- **Open in New Tab** — view the image at full resolution
- **Copy URL** — copy the direct image link to clipboard
- **Download** — save via Canvas Blob method (with graceful browser fallback)

> Handles 404s gracefully: if `maxresdefault` isn't available for a video, a clean "Not available" placeholder is shown instead of a broken image.

### 📝 Description Viewer
Provides a scrollable metadata summary box with a **"Copy Full Summary"** button. Since YouTube's oEmbed doesn't expose full descriptions, TubeMeta presents available metadata cleanly and links to the YouTube video page for the complete description.

### 🕐 Analysis History
- Saves the **last 15 analyzed videos** to `localStorage`
- Quick-access cards with thumbnail + title for instant re-analysis
- **Clear History** button to wipe local data

### 📱 Mobile-First Design
- Responsive layout optimized for thumb-friendly interaction
- Clean white & blue (`#2563EB`) design system
- Premium typography (Outfit & Inter from Google Fonts)
- Smooth micro-animations and hover effects
- Loading skeleton screens while fetching data
- Clear error states for invalid URLs, private videos, and network issues

---

## 📂 Project Structure

```
MetaTube/
├── index.html              # Main single-page application
├── app.js                  # Core JS logic (URL parser, oEmbed, thumbnails, history)
├── style.css               # Global CSS design system
├── about.html              # About page with Formspree contact form
├── privacy-policy.html     # Privacy policy (oEmbed, localStorage, cookies)
├── terms-of-service.html   # Terms of service (personal/educational use)
├── blog/
│   └── index.html          # Blog hub with 3 educational articles
├── robots.txt              # Search engine crawler rules
└── sitemap.xml             # XML sitemap for SEO
```

---

## 🚀 Deployment

This is a **zero-config static site**. No build step, no dependencies, no bundler.

### Deploy to Netlify
1. Push this repo to GitHub
2. Connect the repo on [Netlify](https://netlify.com)
3. Set publish directory to `/` (root)
4. Deploy — done!

### Deploy Anywhere Else
Simply upload the folder contents to any static hosting provider:
- **GitHub Pages** — push and enable Pages in repo settings
- **Vercel** — import the repo, zero config
- **Cloudflare Pages** — connect repo and deploy
- **Any web server** — drop the files into your public directory

---

## 🔒 Privacy & Legal

- **No server** — all processing happens in your browser
- **No tracking** — we don't collect or store your search queries
- **No video downloads** — only public metadata and thumbnail images
- **localStorage only** — history is stored locally on your device
- **oEmbed API** — queries YouTube's official, CORS-enabled public endpoint

See [Privacy Policy](privacy-policy.html) and [Terms of Service](terms-of-service.html) for full details.

---

## 🛠️ How It Works

1. **User pastes a YouTube URL** into the search box
2. **Smart parser** extracts the 11-character video ID using regex + URL parsing
3. **oEmbed fetch** sends a client-side request to `https://www.youtube.com/oembed?url={videoUrl}&format=json`
4. **Metadata is displayed** in a clean card layout
5. **Thumbnail validation** loads each quality in-memory and checks dimensions — if YouTube returns a 120×90 fallback instead of the requested resolution, it's flagged as unavailable
6. **Canvas Blob download** converts images to downloadable files client-side, with a fallback to opening in a new tab if CORS blocks the canvas

---

## 📰 Blog Articles

TubeMeta includes an educational blog with three guides:

1. **How to Download YouTube Thumbnails for Your Own Thumbnail Design**
2. **YouTube oEmbed: How to Get Video Metadata Without an API Key**
3. **Is Using YouTube Thumbnails Fair Use? A Creator's Guide**

---

## 📄 License

This project is provided for personal and educational use. Users must respect YouTube's Terms of Service when using any retrieved metadata or thumbnail images.

---

## 💖 Support My Work

If you find this tool useful, feel free to buy me a coffee or commission me for any custom tools you need built.

🔗 **[Support me on Patreon](https://www.patreon.com/c/MajedBenmansour?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink)**

> ℹ️ **Note:** Due to regional payment restrictions, Patreon is currently my only reliable gateway for international support. One-time donations are completely welcome—feel free to subscribe and cancel right after.
