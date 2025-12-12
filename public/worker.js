// We use v2.15.1 because it is the most stable version for Safari/iOS
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.1';

// SAFARI COMPATIBILITY SETTINGS
// 1. Disable local checks (we want to download from CDN)
env.allowLocalModels = false;

// 2. FORCE SINGLE-THREADED MODE
// This is critical for Safari. Without this, it hangs at 0% because 
// Safari blocks multi-threaded WebAssembly on standard connections.
env.backends.onnx.wasm.numThreads = 1; 
env.backends.onnx.wasm.proxy = false; 

class PipelineSingleton {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny.en';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, { 
                progress_callback,
                // Explicitly ask for the quantized (smaller) version
                quantized: true 
            });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const { audio } = event.data;

    self.postMessage({ status: 'initiate' });

    try {
        const transcriber = await PipelineSingleton.getInstance((data) => {
            if (data.status === 'progress') {
                self.postMessage({ status: 'progress', progress: data.progress });
            }
        });

        self.postMessage({ status: 'decoding' });

        const output = await transcriber(audio, {
            chunk_length_s: 30,
            stride_length_s: 5
        });

        // Robust output extraction
        let text = "";
        if (typeof output === 'string') text = output;
        else if (Array.isArray(output)) text = output[0].text;
        else if (output?.text) text = output.text;
        else text = JSON.stringify(output);

        self.postMessage({ status: 'complete', output: text });

    } catch (err) {
        self.postMessage({ status: 'error', error: err.message });
    }
});