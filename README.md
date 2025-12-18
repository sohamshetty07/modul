# Modul. Studio (v2.0)

![Modul Studio Banner](https://socialify.git.ci/sohamshetty07/modul/image?description=1&descriptionEditable=The%20Privacy-First%20Media%20OS.%20Zero%20Data%20Exfiltration.&font=Inter&language=1&name=1&owner=1&pattern=Circuit%20Board&theme=Dark)

**The Privacy-First Media OS.** Convert, Edit, Encrypt, and Transcribe media without your data ever leaving your device.

[Live Demo](https://modul-eight.vercel.app) · [Report Bug](https://github.com/sohamshetty07/modul/issues) · [Request Feature](https://github.com/sohamshetty07/modul/issues)

---

## 🚀 About The Project

**Modul.** is a serverless media processing suite built with **Next.js 15**. Unlike traditional online tools that require you to upload files to a cloud server, Modul brings the server logic _to your browser_.

It runs industry-standard engines—like **FFmpeg** for video and **Whisper AI** for transcription—directly in your browser using **WebAssembly (WASM)** and **WebWorkers**.

### 🔒 The "Bunker Mode" Philosophy

- **Zero Trust:** Files never leave `localhost`. No uploads, no data retention.
- **Offline First:** Disconnect your Wi-Fi and keep working. The app is fully cached.
- **Serverless:** There is no backend to hack. Your CPU is the server.

---

## ✨ Features Grid

### 🎥 Media Station

- **Universal Converter:** Convert Video (MP4, MKV, MOV), Audio (MP3, WAV), and Images (WEBP, GIF) locally using `ffmpeg.wasm`.
- **Audio Studio:** Professional waveform editor. Trim, Denoise, and Normalize audio recordings visually.
- **Screen Recorder:** Capture your screen and microphone instantly. No extensions, no cloud uploads.

### 🧠 AI & Privacy

- **Transcriber:** Offline Speech-to-Text using OpenAI's **Whisper** model (via `transformers.js` & ONNX).
- **Magic Remover:** Privacy-first redaction. Blur faces, credit cards, or sensitive text from images instantly.
- **The Vault:** AES-GCM Client-side encryption. Securely lock files with a password before sharing them.

### 💼 Office & Utility

- **PDF Tools:** Full manipulation suite. Merge, Split, Compress, and Convert PDFs to images.
- **Dev Utilities:** Offline JSON<>CSV converter, Base64 encoder/decoder, and Wi-Fi QR Code Generator.

### 📱 Progressive Web App (PWA)

- Installable on iOS and Android.
- Works completely offline.
- Native app-like feel with zero browser UI.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
- **Core Engines:**
  - `@ffmpeg/ffmpeg` (Video Processing)
  - `@xenova/transformers` & `onnxruntime-web` (AI Inference)
  - `wavesurfer.js` (Audio Visualization)
  - `pdf-lib` & `jspdf` (PDF Manipulation)
  - `qrcode.react` (Utility Generation)

---

## ⚡ Getting Started

### Prerequisites

- Node.js 18+ (Required for Next.js 15)

### Installation

1.  **Clone the repo**

    ```bash
    git clone [https://github.com/sohamshetty07/modul.git](https://github.com/sohamshetty07/modul.git)
    cd modul
    ```

2.  **Install dependencies**

    ```bash
    npm install
    # or
    bun install
    ```

3.  **Run the development server**

    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

> **Note on SharedArrayBuffer:** > To run FFmpeg.wasm locally, this project uses specific HTTP headers (`Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy`). These are configured in `next.config.ts`. If you deploy to a platform other than Vercel, ensure these headers are set correctly.

---

## 📱 Installing on Mobile (PWA)

Modul is optimized for mobile usage.

1.  Open the deployed URL in **Safari (iOS)** or **Chrome (Android)**.
2.  Tap the **Share** button (iOS) or **Menu** (Android).
3.  Select **"Add to Home Screen"**.
4.  Launch Modul from your home screen for a full-screen, native experience.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

**Soham Shetty**

- GitHub: [@sohamshetty07](https://github.com/sohamshetty07)

---

_Built with ❤️ and way too much coffee._
