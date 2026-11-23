import { LitElement, html, nothing } from 'lit';
import type { Hass, HassEntity } from './types';
import { hasSpotifyPlus, loadLibrary, playItem, searchSpotify, type Library, type MediaItem, type SearchKind } from './spotify';
import { fmtTime, notify, position, speakerIsCurrent } from './util';
import { styles } from './styles';
import { langOf, strings } from './i18n';
import {
  ICON_CLOSE,
  ICON_MUSIC,
  ICON_NEXT,
  ICON_PAUSE,
  ICON_PLAY,
  ICON_PREV,
  ICON_SEARCH,
  ICON_SPEAKER,
  ICON_VOLUME,
} from './icons';

type Tab = 'search' | 'recent' | 'liked' | 'playlists' | 'speakers';

/**
 * Painel de música: tocando agora + busca + biblioteca (SpotifyPlus) + escolha da caixa.
 * Funciona com qualquer media_player; busca e biblioteca aparecem só com o SpotifyPlus.
 *
 * <spotify-panel .hass=${hass} entity="media_player.spotifyplus" mode="full|mini"></spotify-panel>
 *
 * Eventos: `spotify-panel-open` (toque no mini), `hass-notification` (erros, padrão do HA).
 */
export class SpotifyPanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    entity: {},
    mode: {},
    card: { attribute: false },
    _tab: { state: true },
    _lib: { state: true },
    _libLoading: { state: true },
    _q: { state: true },
    _qKind: { state: true },
    _results: { state: true },
    _searching: { state: true },
    _full: { state: true },
  };

  declare hass: Hass | undefined;
  declare entity: string;
  declare mode: 'full' | 'mini';
  /** card de terceiros aberto pelo botão "Spotify completo" */
  declare card: Record<string, unknown> | undefined;
  declare _tab: Tab;
  declare _lib: Library | undefined;
  declare _libLoading: boolean;
  declare _q: string;
  declare _qKind: SearchKind;
  declare _results: MediaItem[] | undefined;
  declare _searching: boolean;
  declare _full: boolean;

  private _libAt = 0;
  private _qTimer?: number;
  private _qSeq = 0;
  private _tick?: number;
  private _fullCard?: HTMLElement & { hass?: Hass };

  static styles = styles;

  constructor() {
    super();
    this.entity = '';
    this.mode = 'full';
    this._tab = 'recent';
    this._libLoading = false;
    this._q = '';
    this._qKind = 'track';
    this._searching = false;
    this._full = false;
  }

  connectedCallback() {
    super.connectedCallback();
    // a barra de progresso anda sozinha entre as atualizações do HA
    this._tick = window.setInterval(() => {
      if (this._player?.state === 'playing' && !this._full) this.requestUpdate();
    }, 1000);
    if (this.mode === 'full') this.refresh();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._tick);
  }

  protected updated(changed: Map<string, unknown>) {
    if (this._fullCard && changed.has('hass')) this._fullCard.hass = this.hass;
    if ((changed.has('hass') && !changed.get('hass')) || changed.has('entity') || changed.has('mode')) {
      if (this.mode === 'full') this.refresh();
    }
  }

  private get _t() {
    return strings(langOf(this.hass));
  }

  private get _player(): HassEntity | undefined {
    return this.entity ? this.hass?.states[this.entity] : undefined;
  }

  private async _call(service: string, data: Record<string, unknown> = {}) {
    if (!this.entity || !this.hass) return;
    try {
      await this.hass.callService('media_player', service, { entity_id: this.entity, ...data });
    } catch (e) {
      notify(this, this._t.failed(String((e as Error).message ?? e)));
    }
  }

  /** recarrega a biblioteca (no máximo a cada 2 min, a não ser com force) */
  async refresh(force = false) {
    if (!this.entity || !this.hass || !hasSpotifyPlus(this.hass)) return;
    if (this._libLoading || (!force && this._lib && Date.now() - this._libAt < 120_000)) return;
    this._libLoading = true;
    try {
      this._lib = await loadLibrary(this.hass, this.entity);
      this._libAt = Date.now();
      if (this._tab === 'recent' && !this._lib.recent.length) this._tab = 'speakers';
    } finally {
      this._libLoading = false;
    }
  }

  private async _play(item: MediaItem, list: MediaItem[]) {
    if (!this.entity || !this.hass) return;
    try {
      await playItem(this.hass, this.entity, item, list);
    } catch (e) {
      notify(this, this._t.failed(String((e as Error).message ?? e)));
    }
  }

  private async _openFull() {
    if (!this.card) return;
    this._full = true;
    if (this._fullCard) return;
    const helpers = await (window as any).loadCardHelpers?.();
    if (!helpers) {
      this._full = false;
      return notify(this, this._t.fullCardOnlyInHa);
    }
    await this.updateComplete;
    // "fill" em cards como o SpotifyPlus = 100vh; aqui o espaço é o do painel, então passa a altura exata (rem)
    const cfg = { ...this.card };
    if (cfg.height === 'fill' || cfg.height === undefined) {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      cfg.height = Math.floor((this.clientHeight / rem) * 100) / 100;
    }
    const el = helpers.createCardElement(cfg);
    el.hass = this.hass;
    this._fullCard = el;
    this.requestUpdate();
  }

  private _seek(e: MouseEvent, dur: number) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    this._call('media_seek', { seek_position: Math.round(k * dur) });
  }

  render() {
    if (this.mode === 'mini') return this._renderMini();
    if (this._full && this._fullCard)
      return html`<div class="wrap">
        <div class="full">${this._fullCard}</div>
        <button class="back" @click=${() => (this._full = false)} title=${this._t.back}>${ICON_PREV}</button>
      </div>`;
    return html`<div class="wrap">${this._renderApp()}</div>`;
  }

  // ---------- mini: tocando agora ----------

  private _renderMini() {
    const st = this._player;
    if (!st || !['playing', 'paused', 'buffering'].includes(st.state) || !st.attributes.media_title) return nothing;
    const a = st.attributes;
    const pos = position(st);
    const dur = typeof a.media_duration === 'number' ? a.media_duration : undefined;
    const pct = pos !== undefined && dur ? (pos / dur) * 100 : 0;
    const stop = (fn: () => void) => (e: Event) => {
      e.stopPropagation();
      fn();
    };
    const open = () => this.dispatchEvent(new CustomEvent('spotify-panel-open', { bubbles: true, composed: true }));
    return html`<div class="np ${st.state === 'playing' ? 'playing' : ''}" @click=${open}>
      <div class="np-top">
        ${a.entity_picture ? html`<img class="np-art" src=${a.entity_picture} alt="" />` : html`<i class="np-art">${ICON_MUSIC}</i>`}
        <div class="np-what">
          <b>${a.media_title}</b>
          <span>${[a.media_artist, a.media_album_name].filter(Boolean).join(' · ')}</span>
          ${a.source ? html`<em>${ICON_SPEAKER}${a.source}</em>` : nothing}
        </div>
      </div>
      ${dur
        ? html`<div class="np-bar"><i style="width:${pct}%"></i></div>
            <div class="np-time"><span>${fmtTime(pos)}</span><span>${fmtTime(dur)}</span></div>`
        : nothing}
      <div class="np-ctrl">
        <button @click=${stop(() => this._call('media_previous_track'))} title=${this._t.previous}>${ICON_PREV}</button>
        <button class="main" @click=${stop(() => this._call('media_play_pause'))} title=${this._t.playPause}>
          ${st.state === 'playing' ? ICON_PAUSE : ICON_PLAY}
        </button>
        <button @click=${stop(() => this._call('media_next_track'))} title=${this._t.next}>${ICON_NEXT}</button>
      </div>
    </div>`;
  }

  // ---------- completo ----------

  private _renderApp() {
    const st = this._player;
    if (!st) return html`<div class="mp"><p class="mp-empty">${this._t.entityNotFound(this.entity || this._t.noEntity)}</p></div>`;
    const a = st.attributes;
    const playing = st.state === 'playing';
    const vol = typeof a.volume_level === 'number' ? Math.round(a.volume_level * 100) : undefined;
    const pos = position(st);
    const dur = typeof a.media_duration === 'number' ? a.media_duration : undefined;
    const pct = pos !== undefined && dur ? (pos / dur) * 100 : 0;
    const spotify = hasSpotifyPlus(this.hass);
    const lib = this._lib;
    const t = this._t;
    const tabs: [Tab, string, number | undefined][] = [
      ...(spotify
        ? ([
            ['search', t.tabSearch, undefined],
            ['recent', t.tabRecent, lib?.recent.length],
            ['liked', t.tabLiked, lib?.liked.length],
            ['playlists', t.tabPlaylists, lib?.playlists.length],
          ] as [Tab, string, number | undefined][])
        : []),
      ['speakers', t.tabSpeakers, undefined],
    ];
    const visible = tabs.filter(([id, , n]) => id === 'speakers' || id === 'search' || !lib || n);
    const tab = visible.some(([id]) => id === this._tab) ? this._tab : 'speakers';

    return html`<div class="mp">
      ${a.entity_picture ? html`<div class="mp-bg" style="background-image:url('${a.entity_picture}')"></div>` : nothing}
      <section class="mp-now">
        <div class="mp-cover">${a.entity_picture ? html`<img src=${a.entity_picture} alt="" />` : ICON_MUSIC}</div>
        <div class="mp-title">${a.media_title ?? this._t.nothingPlaying}</div>
        <div class="mp-artist">${[a.media_artist, a.media_album_name].filter(Boolean).join(' · ')}</div>
        ${a.source ? html`<div class="mp-source">${ICON_SPEAKER}${a.source}</div>` : nothing}
        ${dur
          ? html`<div class="mp-bar" @click=${(e: MouseEvent) => this._seek(e, dur)}><i style="width:${pct}%"></i></div>
              <div class="mp-time"><span>${fmtTime(pos)}</span><span>${fmtTime(dur)}</span></div>`
          : nothing}
        <div class="mp-ctrl">
          <button @click=${() => this._call('media_previous_track')} title=${this._t.previous}>${ICON_PREV}</button>
          <button class="main" @click=${() => this._call('media_play_pause')} title=${this._t.playPause}>${playing ? ICON_PAUSE : ICON_PLAY}</button>
          <button @click=${() => this._call('media_next_track')} title=${this._t.next}>${ICON_NEXT}</button>
        </div>
        ${vol !== undefined
          ? html`<label class="mp-vol"
              >${ICON_VOLUME}<input
                type="range"
                min="0"
                max="100"
                .value=${String(vol)}
                @change=${(e: Event) => this._call('volume_set', { volume_level: Number((e.target as HTMLInputElement).value) / 100 })}
            /></label>`
          : nothing}
      </section>

      <section class="mp-lib">
        <nav>
          ${visible.map(([id, label]) => html`<button class=${tab === id ? 'sel' : ''} @click=${() => (this._tab = id)}>${label}</button>`)}
          ${this.card ? html`<button class="full" @click=${this._openFull} title=${this._t.openFullTitle}>${this._t.openFull}</button>` : nothing}
        </nav>
        ${tab === 'search' ? this._renderSearchBox() : nothing}
        <div class="mp-list">
          ${tab === 'speakers' ? this._renderSpeakers(st) : tab === 'search' ? this._renderResults() : this._renderItems(tab)}
        </div>
      </section>
    </div>`;
  }

  // ---------- busca ----------

  private _onQuery(e: Event) {
    this._q = (e.target as HTMLInputElement).value;
    clearTimeout(this._qTimer);
    // espera a pessoa parar de digitar
    this._qTimer = window.setTimeout(() => this._search(), 450);
  }

  private async _search() {
    clearTimeout(this._qTimer);
    const q = this._q.trim();
    if (!q || !this.entity || !this.hass) {
      this._results = undefined;
      return;
    }
    const seq = ++this._qSeq;
    this._searching = true;
    try {
      const res = await searchSpotify(this.hass, this.entity, this._qKind, q);
      // ignora respostas de buscas antigas que chegaram atrasadas
      if (seq === this._qSeq) this._results = res;
    } catch (e) {
      if (seq === this._qSeq) notify(this, this._t.searchFailed(String((e as Error).message ?? e)));
    } finally {
      if (seq === this._qSeq) this._searching = false;
    }
  }

  private _renderSearchBox() {
    const kinds: [SearchKind, string][] = [
      ['track', this._t.kindTracks],
      ['artist', this._t.kindArtists],
      ['album', this._t.kindAlbums],
      ['playlist', this._t.kindPlaylists],
    ];
    return html`<div class="mp-search">
      <label>
        ${ICON_SEARCH}
        <input
          type="search"
          placeholder=${this._t.searchPlaceholder}
          enterkeyhint="search"
          autocomplete="off"
          .value=${this._q}
          @input=${this._onQuery}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              this._search();
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        ${this._q
          ? html`<button
              class="clear"
              @click=${() => {
                this._q = '';
                this._results = undefined;
              }}
              title=${this._t.clear}
            >
              ${ICON_CLOSE}
            </button>`
          : nothing}
      </label>
      <div class="kinds">
        ${kinds.map(
          ([k, label]) =>
            html`<button
              class=${this._qKind === k ? 'sel' : ''}
              @click=${() => {
                this._qKind = k;
                this._search();
              }}
            >
              ${label}
            </button>`,
        )}
      </div>
    </div>`;
  }

  private _renderResults() {
    if (this._searching && !this._results) return html`<p class="mp-empty">${this._t.searching}</p>`;
    if (!this._q.trim()) return html`<p class="mp-empty">${this._t.searchHint}</p>`;
    if (!this._results) return nothing;
    if (!this._results.length) return html`<p class="mp-empty">${this._t.noResults(this._q)}</p>`;
    return this._renderGrid(this._results, this._searching);
  }

  private _renderGrid(list: MediaItem[], dim = false) {
    const current = this._player?.attributes.media_title;
    return html`<div class="mp-grid ${dim ? 'dim' : ''}">
      ${list.map(
        (it) => html`<button
          class="mp-item ${it.kind} ${it.kind === 'track' && it.name === current ? 'now' : ''}"
          @click=${() => this._play(it, list)}
        >
          ${it.image ? html`<img src=${it.image} alt="" loading="lazy" />` : html`<i>${ICON_MUSIC}</i>`}
          <b>${it.name}</b><span>${it.sub}</span>
        </button>`,
      )}
    </div>`;
  }

  private _renderItems(tab: Tab) {
    if (!this._lib) return html`<p class="mp-empty">${this._libLoading ? this._t.loading : ''}</p>`;
    const list = tab === 'recent' ? this._lib.recent : tab === 'liked' ? this._lib.liked : this._lib.playlists;
    return this._renderGrid(list);
  }

  private _renderSpeakers(st: HassEntity) {
    const list: string[] = (st.attributes.source_list ?? []).filter((x: string) => x);
    if (!list.length) return html`<p class="mp-empty">${this._t.noSpeakers}</p>`;
    return html`<div class="mp-speakers">
      ${list.map((x) => {
        const cur = speakerIsCurrent(st, x);
        return html`<button class=${cur ? 'sel' : ''} @click=${() => this._call('select_source', { source: x })}>
          ${ICON_SPEAKER}<b>${x}</b><span>${cur ? (st.state === 'playing' ? this._t.playingHere : this._t.selected) : this._t.playHere}</span>
        </button>`;
      })}
    </div>`;
  }
}

if (!customElements.get('spotify-panel')) customElements.define('spotify-panel', SpotifyPanel);

declare global {
  interface HTMLElementTagNameMap {
    'spotify-panel': SpotifyPanel;
  }
}
