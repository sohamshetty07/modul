import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.1';

// ULTIMATE iOS/SAFARI FIX:
// We use v2.15.1 (stable) and apply the most aggressive single-thread, non-shared memory settings.
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1; // Forces single-thread
env.backends.onnx.wasm.proxy = false; // Disables worker-within-worker
// CRITICAL FOR iOS/Mobile: Manually force the memory model to non-shared
env.backends.onnx.wasm.init = () => ({
    initialized: true,
    wasm: true,
    // Set memory model to single-page to avoid SharedArrayBuffer conflicts blocked by iOS
    memory: { 'shared': false } 
});

class PipelineSingleton {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny.en';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, { 
                progress_callback,
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