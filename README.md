# Spotify Panel Card

A Home Assistant Lovelace card with a touch-friendly **Spotify panel**: what is playing, search, your library and the speaker picker, in one screen. A compact **mini** mode shows only what is playing and opens the full panel when tapped.

![Spotify Panel Card: the full panel with the library, and the mini player beside it](https://raw.githubusercontent.com/peter-gabriel/spotify-panel-card/main/docs/screenshot.png)

*Screenshots use fictional songs and artists.*

- **Now playing:** cover, song, artist, progress bar (tap to seek), play/pause, previous, next and volume. The background takes the colors of the cover.
- **Search:** songs, artists, albums and playlists. Results update as you type, and tapping one plays it right away.
- **Library:** **Recent**, **Liked** and **Playlists**. Empty tabs are hidden. Playing a song from a list queues the songs after it.
- **Speakers:** every source of the player (Spotify Connect devices, Alexa, Bluetooth speakers…). Tap one to move the music there.
- **Mini mode:** cover, song, progress and controls in a small card. Tap it to open the full panel over the dashboard.
- **Full third-party card:** optionally, a **Full Spotify** button opens another card (for example the SpotifyPlus card) inside the panel.
- **Localized:** Brazilian Portuguese, Spanish and English, following your Home Assistant language. Anything else falls back to English.

## Requirements

- Any `media_player` works for now playing, the controls and the speakers.
- **Search** and the **library tabs** need the [SpotifyPlus](https://github.com/thlucas1/homeassistantcomponent_spotifyplus) integration, because they use its services (`search_tracks`, `get_player_recent_tracks`, `get_track_favorites`…). Without SpotifyPlus those tabs are hidden.

## Installation

The card is not in the default store yet, so you add it by its GitHub link. Updates then arrive with each new release.

### Marketplace (newer Home Assistant versions)

1. Open **Marketplace** in the sidebar and click **Add from link** (top right).
2. Paste `https://github.com/peter-gabriel/spotify-panel-card` and click **Add**.
3. Search for **Spotify Panel Card**, open it and click **Install**.
4. Reload the browser when asked.

The Marketplace adds the dashboard resource for you.

### HACS

1. In HACS → ⋮ → **Custom repositories**, add `https://github.com/peter-gabriel/spotify-panel-card` with the type **Dashboard**.
2. Search for **Spotify Panel Card**, download it, and reload the browser.

HACS adds the dashboard resource for you.

### Manual

1. Download `spotify-panel-card.js` from the [latest release](https://github.com/peter-gabriel/spotify-panel-card/releases/latest).
2. Copy it to `/config/www/`.
3. Add it under **Settings → Dashboards → ⋮ → Resources** as `/local/spotify-panel-card.js`, with the type *JavaScript module*.

If you switch from a manual install to the Marketplace or HACS, delete the old `/local/spotify-panel-card.js` resource. Otherwise the card is loaded twice.

## Configuration

```yaml
type: custom:spotify-panel-card
entity: media_player.spotifyplus_yourname   # required
mode: full                                  # full | mini
height: 600                                 # full mode: px or any CSS height, e.g. 100%
card:                                       # optional: card behind the "Full Spotify" button
  type: custom:spotifyplus-card
  entity: media_player.spotifyplus_yourname
```

| Option | Default | Description |
| --- | --- | --- |
| `entity` | — | The `media_player` to control. |
| `mode` | `full` | `full` shows the whole panel; `mini` shows only what is playing and opens the panel when tapped. |
| `height` | `600` | Height of the full panel, in px or any CSS height. Use `100%` in a panel view. |
| `card` | — | Any card config, opened inside the panel by the **Full Spotify** button. A `height: fill` is replaced with the panel's exact height. |

### Colors

Set these CSS variables (for example with card-mod or a theme) to match your dashboard:

| Variable | Default |
| --- | --- |
| `--sp-fg` | `#eef0f3` |
| `--sp-muted` | `#9aa3ae` |
| `--sp-bg` | `#121418` |
| `--sp-glass` | `rgba(20, 23, 29, 0.62)` |

## Using the panel in your own card

The panel is also a plain web component, `<spotify-panel>`, so other cards can embed it. [HADash 3D Card](https://github.com/peter-gabriel/hadash-card) does this for its music button.

```ts
import 'spotify-panel-card/panel';

html`<spotify-panel .hass=${hass} entity="media_player.spotifyplus_yourname" mode="full"></spotify-panel>`;
```

- `mode="mini"` fires `spotify-panel-open` when tapped.
- Errors are sent as `hass-notification` events, which Home Assistant shows as a toast. Catch them to show your own.

## Development

```bash
npm install
npm test          # library mapping, i18n and helper tests
npm run build     # outputs dist/spotify-panel-card.js
npm run dev       # demo with a fake Home Assistant on http://localhost:5183
```

### Quick dev loop

```bash
npm run ha
```

This rebuilds on every change and serves the file at `http://<your-machine-ip>:5184/spotify-panel-card.js`. Add that URL as a resource on a test dashboard, then refresh Home Assistant after each change.

### Adding a language

UI strings live in [`src/i18n.ts`](src/i18n.ts). Add a dictionary of type `Strings` and map its language prefix in `strings()`.

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branching model (git flow), the pull request flow and how releases are made.

## License

[MIT](LICENSE)
