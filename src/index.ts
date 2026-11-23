export { OmniumMusicPanel } from './music-panel';
export { OmniumMusicCard } from './music-card';
export * from './spotify';
export type { Hass, HassEntity, PanelCardConfig } from './types';

declare const __VERSION__: string;
console.info(`%cOMNIUM-MUSIC ${typeof __VERSION__ === 'string' ? __VERSION__ : 'dev'}`, 'color:#1ed760;font-weight:bold');
