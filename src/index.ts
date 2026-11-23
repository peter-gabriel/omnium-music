export { SpotifyPanel } from './spotify-panel';
export { SpotifyPanelCard } from './spotify-panel-card';
export * from './spotify';
export type { Hass, HassEntity, PanelCardConfig } from './types';

declare const __VERSION__: string;
console.info(`%cSPOTIFY-PANEL-CARD ${typeof __VERSION__ === 'string' ? __VERSION__ : 'dev'}`, 'color:#1ed760;font-weight:bold');
