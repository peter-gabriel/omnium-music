import { LitElement, css, html, nothing } from 'lit';
import type { Hass, PanelCardConfig } from './types';
import { ICON_CLOSE } from './icons';
import './music-panel';
import { langOf, strings } from './i18n';

/**
 * Card do Lovelace em volta do <omnium-music-panel>.
 *
 * type: custom:omnium-music
 * entity: media_player.spotifyplus_xxx
 * mode: full | mini
 * height: 600
 */
export class OmniumMusicCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _open: { state: true },
  };

  declare hass: Hass | undefined;
  declare _config: PanelCardConfig;
  declare _open: boolean;

  constructor() {
    super();
    this._open = false;
  }

  setConfig(config: PanelCardConfig) {
    if (!config?.entity) throw new Error(strings(langOf(this.hass)).errEntity);
    this._config = config;
  }

  getCardSize() {
    return this._config?.mode === 'mini' ? 3 : 10;
  }

  getGridOptions() {
    return this._config?.mode === 'mini' ? { columns: 6, rows: 3, min_columns: 4 } : { columns: 'full', rows: 10, min_rows: 6 };
  }

  static getStubConfig(hass: Hass) {
    const ids = Object.keys(hass.states).filter((id) => id.startsWith('media_player.'));
    const entity = ids.find((id) => id.includes('spotify')) ?? ids[0] ?? '';
    return { entity, mode: 'full' };
  }

  render() {
    const c = this._config;
    if (!c) return nothing;
    const h = c.height ?? 600;
    if (c.mode === 'mini')
      return html`<ha-card class="mini">
          <omnium-music-panel .hass=${this.hass} entity=${c.entity} mode="mini" @omnium-music-open=${() => (this._open = true)}></omnium-music-panel>
          ${this._idle()}
        </ha-card>
        ${this._open
          ? html`<div class="overlay" @click=${(e: Event) => e.target === e.currentTarget && (this._open = false)}>
              <div class="dialog">
                <omnium-music-panel .hass=${this.hass} entity=${c.entity} mode="full" .card=${c.card} style="--sp-nav-gap:60px"></omnium-music-panel>
                <button class="close" @click=${() => (this._open = false)} title=${strings(langOf(this.hass)).close}>${ICON_CLOSE}</button>
              </div>
            </div>`
          : nothing}`;
    return html`<ha-card class="full" style="height:${typeof h === 'number' ? `${h}px` : h}">
      <omnium-music-panel .hass=${this.hass} entity=${c.entity} mode="full" .card=${c.card}></omnium-music-panel>
    </ha-card>`;
  }

  /** mini sem nada tocando: mostra um cartão discreto que abre o painel */
  private _idle() {
    const st = this.hass?.states[this._config.entity];
    if (st && ['playing', 'paused', 'buffering'].includes(st.state) && st.attributes.media_title) return nothing;
    const t = strings(langOf(this.hass));
    return html`<button class="idle" @click=${() => (this._open = true)}>
      <b>${st?.attributes.friendly_name ?? t.idleTitle}</b><span>${t.idleHint}</span>
    </button>`;
  }

  static styles = css`
    ha-card {
      overflow: hidden;
      background: var(--sp-card-bg, #121418);
      color: #eef0f3;
    }
    ha-card.full omnium-music-panel {
      height: 100%;
    }
    ha-card.mini {
      --sp-glass: transparent;
    }
    .idle {
      width: 100%;
      min-height: 72px;
      padding: 14px 16px;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 2px;
      cursor: pointer;
    }
    .idle span {
      font-size: 13px;
      color: #9aa3ae;
    }
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 10;
      display: flex;
      padding: 16px;
      box-sizing: border-box;
      background: rgba(12, 14, 18, 0.72);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }
    .dialog {
      position: relative;
      flex: 1;
      min-height: 0;
      max-width: 1200px;
      margin: 0 auto;
    }
    .dialog omnium-music-panel {
      height: 100%;
    }
    .close {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 48px;
      height: 48px;
      border: 0;
      border-radius: 14px;
      background: rgba(20, 23, 29, 0.62);
      color: #eef0f3;
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .close svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
  `;
}

if (!customElements.get('omnium-music')) {
  customElements.define('omnium-music', OmniumMusicCard);
  ((window as any).customCards ??= []).push({
    type: 'omnium-music',
    name: 'Omnium Music',
    description: 'Now playing, search, library and speaker picker (SpotifyPlus)',
    preview: false,
  });
}
