import { init_planegcs_module, GcsWrapper } from '@salusoft89/planegcs';
export async function initGcsWrapper() {
    const mod = await init_planegcs_module();
    const gcs_system_wasm = new mod.GcsSystem();
    const gcs_wrapper = new GcsWrapper(gcs_system_wasm);
    return gcs_wrapper;
}
