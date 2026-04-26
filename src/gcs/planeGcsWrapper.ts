import { make_gcs_wrapper } from '@salusoft89/planegcs';
import wasmUrl from '@salusoft89/planegcs/dist/planegcs_dist/planegcs.wasm?url';

export async function initGcsWrapper() {
    return make_gcs_wrapper(wasmUrl);
}
