// NOTE: We import from a local file because the CDN version is blocked 
// by the strict COEP headers required for FFmpeg. 
// DO NOT switch back to CDN without verifying headers first.

import { pipeline, env } from '/transformers.min.js';

// ULTIMATE iOS/SAFARI FIX:
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1; 
env.backends.onnx.wasm.proxy = false; 
// CRITICAL FOR iOS/Mobile: Manually force the memory model to non-shared
env.backends.onnx.wasm.init = () => ({
    initialized: true,
    wasm: true,
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