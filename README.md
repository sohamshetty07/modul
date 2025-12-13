# Modul. Studio

![Modul. Studio Banner](public/apple-icon.png)

**The Privacy-First Media Studio.** Convert, Edit, and Transcribe media without your data ever leaving your device.

[Live Demo](https://modul-eight.vercel.app) · [Report Bug](https://github.com/sohamshetty07/modul/issues) · [Request Feature](https://github.com/sohamshetty07/modul/issues)

---

## 🚀 About The Project

**Modul.** is a serverless media processing suite built with Next.js 15. Unlike traditional online converters that upload files to a cloud server, Modul runs advanced processing logic—including AI models and video encoding—directly in the user's browser using **WebAssembly (WASM)** and **WebWorkers**.

### Why?
* **Privacy:** Files never leave `localhost`. No uploads, no data retention.
* **Speed:** No upload/download wait times. Zero latency processing.
* **Cost:** $0 server costs for processing. It scales infinitely because it uses the *user's* CPU/GPU.

## ✨ Features

### 1. Universal Converter 🎥
Powered by a custom **FFmpeg.wasm** engine.
* Convert Video (MP4, MOV, MKV, GIF)
* Convert Audio (MP3, WAV, AAC)
* Convert Images (PNG, JPG, WEBP)
* Compress files with granular quality/resize controls.

### 2. Magic Remover 🪄
Background removal running locally using **@imgly/background-removal**.
* Process high-res images instantly.
* Runs in a separate thread to prevent UI freezing.

### 3. Audio Transcriber 🎙️
Speech-to-text powered by **Transformers.js** (OpenAI Whisper model).
* Runs quantized ONNX models in the browser.
* Supports timestamped transcription.

### 4. PDF Tools 📄
Full-featured PDF manipulation using **pdf-lib** and **jspdf**.
* **Merge:** Combine multiple PDFs.
* **Split:** Extract specific pages with a visual selector.
* **Compress:** Reduce PDF file size via canvas re-rendering.
* **To Images:** Convert PDF pages to a ZIP of JPGs.

### 5. Progressive Web App (PWA) 📱
* Installable on iOS and Android.
* Offline capability.
* Native app-like feel (No browser UI).

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
* **Language:** TypeScript
* **Styling:** Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
* **Core Engines:**
    * `@ffmpeg/ffmpeg` (Video Processing)
    * `@xenova/transformers` (AI Transcription)
    * `@imgly/background-removal` (Computer Vision)
    * `pdf-lib` (PDF Manipulation)

---

## ⚡ Getting Started

### Prerequisites
* Node.js 18+ (Required for Next.js 15)

### Installation

1.  **Clone the repo**
    ```bash
    git clone [https://github.com/sohamshetty07/modul.git](https://github.com/sohamshetty07/modul.git)
    cd modul
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

> **Note on SharedArrayBuffer:** > To run FFmpeg.wasm locally, this project uses specific HTTP headers (`Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy`). These are configured in `next.config.mjs`. If you deploy to a platform other than Vercel, ensure these headers are set.

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
* GitHub: [@sohamshetty07](https://github.com/sohamshetty07)

---

*Built with ❤️ and way too much coffee.*