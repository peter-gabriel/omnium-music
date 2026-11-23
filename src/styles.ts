import { css } from 'lit';

export const styles = css`
    :host {
      /* personalize por fora: --sp-fg, --sp-muted, --sp-bg, --sp-glass, --sp-accent */
      --fg: var(--sp-fg, #eef0f3);
      --muted: var(--sp-muted, #9aa3ae);
      --glass: var(--sp-glass, rgba(20, 23, 29, 0.62));
      display: block;
      container: sp / inline-size;
      color: var(--fg);
      font-family: var(--sp-font, inherit);
    }
    svg {
      fill: currentColor;
    }
    .wrap {
      position: relative;
      height: 100%;
    }
    .wrap > .mp,
    .wrap > .full {
      height: 100%;
    }
    .full {
      overflow: auto;
      border-radius: 16px;
    }
    .back {
      position: absolute;
      top: 6px;
      left: 6px;
      z-index: 1;
      width: 48px;
      height: 48px;
      border: 0;
      border-radius: 14px;
      background: var(--glass);
      color: var(--fg);
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .back svg {
      width: 24px;
      height: 24px;
    }
    .mp svg {
      fill: currentColor;
    }
    .np {
      box-sizing: border-box;
      padding: 12px;
      border-radius: 18px;
      background: var(--glass);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      cursor: pointer;
    }
    .np-top {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .np-art {
      width: 72px;
      height: 72px;
      flex: none;
      border-radius: 10px;
      object-fit: cover;
      display: grid;
      place-items: center;
      background: #1ed76033;
      color: #1ed760;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    }
    .np-art svg {
      width: 32px;
      height: 32px;
      fill: currentColor;
    }
    .np-what {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      line-height: 1.25;
    }
    .np-what b,
    .np-what span,
    .np-what em {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .np-what b {
      font-size: 16px;
    }
    .np-what span {
      color: var(--muted);
      font-size: 13px;
    }
    .np-what em {
      font-style: normal;
      font-size: 12px;
      color: #1ed760;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .np-what em svg {
      width: 14px;
      height: 14px;
      flex: none;
      fill: currentColor;
    }
    .np:not(.playing) .np-what em {
      color: var(--muted);
    }
    .np-bar {
      margin-top: 12px;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.15);
      overflow: hidden;
    }
    .np-bar i {
      display: block;
      height: 100%;
      background: var(--fg);
      border-radius: 2px;
    }
    .np.playing .np-bar i {
      background: #1ed760;
    }
    .np-time {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      font-size: 11px;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
    .np-ctrl {
      display: flex;
      justify-content: center;
      gap: 18px;
      margin-top: 6px;
    }
    .np-ctrl button {
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--fg);
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .np-ctrl button.main {
      background: var(--fg);
      color: #15181d;
    }
    .np-ctrl svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    .mp,
    .mp-list {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    }
    .mp {
      position: relative;
      display: grid;
      grid-template-columns: minmax(280px, 38%) 1fr;
      gap: 28px;
      height: 100%;
      padding: 28px;
      box-sizing: border-box;
      overflow: hidden;
      border-radius: 18px;
      background: var(--sp-bg, #121418);
    }
    .mp-bg {
      position: absolute;
      inset: -40px;
      background-size: cover;
      background-position: center;
      filter: blur(60px) saturate(1.4);
      opacity: 0.45;
      pointer-events: none;
    }
    .mp > section {
      position: relative;
      min-height: 0;
    }
    .mp-empty {
      color: var(--muted);
      text-align: center;
      margin-top: 40px;
    }
    .mp-now {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 6px;
    }
    .mp-cover {
      width: 100%;
      max-width: 340px;
      max-height: 42vh;
      aspect-ratio: 1;
      align-self: center;
      border-radius: 14px;
      overflow: hidden;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #1ed76044, #1b1e24);
      color: #1ed760;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
      margin-bottom: 14px;
    }
    .mp-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .mp-cover svg {
      width: 40%;
      height: 40%;
    }
    .mp-title {
      font-size: 24px;
      font-weight: 700;
      line-height: 1.2;
    }
    .mp-artist {
      color: var(--muted);
      font-size: 15px;
    }
    .mp-source {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #1ed760;
      font-size: 13px;
    }
    .mp-source svg {
      width: 16px;
      height: 16px;
    }
    .mp-bar {
      margin-top: 14px;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.18);
      cursor: pointer;
      /* área de toque maior que a barra */
      background-clip: content-box;
      padding: 8px 0;
    }
    .mp-bar i {
      display: block;
      height: 100%;
      border-radius: 3px;
      background: #1ed760;
    }
    .mp-time {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
      margin-top: -4px;
    }
    .mp-ctrl {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 22px;
      margin: 10px 0 6px;
    }
    .mp-ctrl button {
      width: 56px;
      height: 56px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--fg);
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .mp-ctrl button.main {
      width: 68px;
      height: 68px;
      background: var(--fg);
      color: #111;
    }
    .mp-ctrl svg {
      width: 30px;
      height: 30px;
    }
    .mp-vol {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
    }
    .mp-vol svg {
      width: 20px;
      height: 20px;
      flex: none;
    }
    .mp-vol input {
      flex: 1;
      accent-color: #1ed760;
    }
    .mp-lib {
      display: flex;
      flex-direction: column;
    }
    .mp-lib nav {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding-right: var(--sp-nav-gap, 0px);
      margin-bottom: 14px;
    }
    .mp-lib nav button {
      min-height: 40px;
      padding: 0 16px;
      border: 0;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--fg);
      font: inherit;
      font-size: 14px;
      cursor: pointer;
    }
    .mp-lib nav button.sel {
      background: var(--fg);
      color: #111;
    }
    .mp-lib nav button.full {
      margin-left: auto;
      background: transparent;
      color: var(--muted);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .mp-list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding-right: 4px;
    }
    .mp-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 14px;
    }
    .mp-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px;
      border: 0;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--fg);
      font: inherit;
      text-align: left;
      cursor: pointer;
      min-width: 0;
    }
    .mp-item:active {
      background: rgba(255, 255, 255, 0.12);
    }
    .mp-item img,
    .mp-item i {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 8px;
      object-fit: cover;
      display: grid;
      place-items: center;
      background: #1ed76022;
      color: #1ed760;
      margin-bottom: 4px;
    }
    .mp-item b,
    .mp-item span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 14px;
    }
    .mp-item span {
      font-size: 12px;
      color: var(--muted);
    }
    .mp-item.now b {
      color: #1ed760;
    }
    .mp-search {
      margin-bottom: 14px;
    }
    .mp-search label {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 52px;
      padding: 0 8px 0 16px;
      border-radius: 26px;
      background: var(--fg);
      color: #121418;
    }
    .mp-search label > svg {
      width: 22px;
      height: 22px;
      flex: none;
      fill: currentColor;
    }
    .mp-search input {
      flex: 1;
      min-width: 0;
      height: 100%;
      border: 0;
      outline: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 17px;
    }
    .mp-search input::-webkit-search-cancel-button {
      display: none;
    }
    .mp-search .clear {
      width: 40px;
      height: 40px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: inherit;
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .mp-search .clear svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    .mp-search .kinds {
      display: flex;
      gap: 8px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .mp-search .kinds button {
      min-height: 36px;
      padding: 0 14px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 18px;
      background: transparent;
      color: var(--fg);
      font: inherit;
      font-size: 13px;
      cursor: pointer;
    }
    .mp-search .kinds button.sel {
      background: #1ed760;
      border-color: #1ed760;
      color: #111;
    }
    .mp-grid.dim {
      opacity: 0.5;
      transition: opacity 0.2s;
    }
    .mp-item.artist img,
    .mp-item.artist i {
      border-radius: 50%;
    }
    .mp-speakers {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 12px;
    }
    .mp-speakers button {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      padding: 16px;
      border: 1px solid transparent;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.06);
      color: var(--fg);
      font: inherit;
      cursor: pointer;
      text-align: left;
    }
    .mp-speakers svg {
      width: 28px;
      height: 28px;
      color: var(--muted);
    }
    .mp-speakers b {
      font-size: 15px;
    }
    .mp-speakers span {
      font-size: 12px;
      color: var(--muted);
    }
    .mp-speakers button.sel {
      border-color: #1ed760;
      background: #1ed7601a;
    }
    .mp-speakers button.sel svg,
    .mp-speakers button.sel span {
      color: #1ed760;
    }
    /* tablet em pé / tela estreita: tocando agora em cima, lista embaixo */
    @container sp (max-width: 760px) {
      .mp {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr;
        overflow-y: auto;
      }
      .mp-cover {
        max-width: 220px;
      }
      /* uma rolagem só: o painel inteiro */
      .mp-list {
        overflow: visible;
      }
    }
`;
