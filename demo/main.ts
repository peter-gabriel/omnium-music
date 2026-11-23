/** demo com um Home Assistant falso: player do SpotifyPlus, biblioteca e busca de mentira */
import '../src/index';
import type { Hass, HassEntity } from '../src/types';

const cover = (txt: string, a: string, b: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="300" height="300" fill="url(#g)"/><text x="24" y="270" font-family="sans-serif" font-size="44" font-weight="700" fill="#fff">${txt}</text></svg>`,
  );

// faixas fictícias
const TRACKS = [
  ['Luz da Manhã', 'Banda Exemplo', 'Primeiro Disco', '#ff7a59', '#7a2bff'],
  ['Estrada Longa', 'Trio Imaginário', 'Viagens', '#1ed760', '#0b5d3b'],
  ['Noite Calma', 'Quarteto Demo', 'Horas', '#3f80cf', '#141820'],
  ['Maré Alta', 'Banda Exemplo', 'Primeiro Disco', '#ffb45c', '#a33'],
  ['Cidade Neon', 'Coletivo Teste', 'Luzes', '#ff3d7f', '#301050'],
  ['Café e Chuva', 'Trio Imaginário', 'Viagens', '#8b95a2', '#2a2f37'],
].map(([name, artist, album, a, b], i) => ({
  name,
  uri: `spotify:track:demo${i}`,
  artists: [{ name: artist }],
  album: { name: album, images: [{ url: cover(name.split(' ')[0], a, b) }] },
}));

let current = 0;
const player = (): HassEntity => {
  const t = TRACKS[current];
  return {
    entity_id: 'media_player.spotifyplus',
    state,
    attributes: {
      friendly_name: 'Spotify',
      media_title: t.name,
      media_artist: t.artists[0].name,
      media_album_name: t.album.name,
      entity_picture: t.album.images[0].url,
      media_duration: 214,
      media_position: pos,
      media_position_updated_at: posAt,
      volume_level: volume,
      source,
      source_list: ['Sala', 'Cozinha', 'Escritório', 'Caixa Bluetooth'],
    },
  };
};
let state = 'playing';
let pos = 40;
let posAt = new Date().toISOString();
let volume = 0.4;
let source = 'Sala';

const hass: Hass = {
  states: {},
  services: { spotifyplus: {}, media_player: {} },
  async callService(domain, service, data = {}) {
    if (domain === 'spotifyplus') {
      const uri = String(data.uris ?? data.context_uri ?? '').split(',')[0];
      const i = TRACKS.findIndex((t) => t.uri === uri);
      current = i >= 0 ? i : (current + 1) % TRACKS.length;
      state = 'playing';
      pos = 0;
    }
    if (service === 'media_play_pause') {
      pos += state === 'playing' ? (Date.now() - Date.parse(posAt)) / 1000 : 0;
      state = state === 'playing' ? 'paused' : 'playing';
    }
    if (service === 'media_next_track' || service === 'media_previous_track') {
      current = (current + (service === 'media_next_track' ? 1 : TRACKS.length - 1)) % TRACKS.length;
      pos = 0;
    }
    if (service === 'select_source') source = String(data.source);
    if (service === 'volume_set') volume = Number(data.volume_level);
    if (service === 'media_seek') pos = Number(data.seek_position);
    posAt = new Date().toISOString();
    push();
  },
  async callWS<T>(msg: Record<string, unknown>): Promise<T> {
    const svc = String(msg.service);
    const q = String((msg.service_data as any)?.criteria ?? '').toLowerCase();
    let items: unknown[] = [];
    if (svc === 'get_player_recent_tracks') items = TRACKS.map((track) => ({ track }));
    if (svc === 'get_track_favorites') items = TRACKS.slice(1, 4).map((track) => ({ track }));
    if (svc === 'get_playlist_favorites')
      items = ['Para relaxar', 'Foco', 'Fim de semana'].map((name, i) => ({
        name,
        uri: `spotify:playlist:demo${i}`,
        owner: { display_name: 'Você' },
        images: [{ url: cover(name.split(' ')[0], ['#1ed760', '#3f80cf', '#ff7a59'][i], '#111') }],
      }));
    if (svc === 'search_tracks') items = TRACKS.filter((t) => (t.name + t.artists[0].name).toLowerCase().includes(q));
    if (svc === 'search_artists')
      items = [...new Set(TRACKS.map((t) => t.artists[0].name))]
        .filter((n) => n.toLowerCase().includes(q))
        .map((name, i) => ({ name, uri: `spotify:artist:demo${i}`, followers: { total: 12000 * (i + 1) } }));
    await new Promise((r) => setTimeout(r, 300));
    return { response: { result: { items } } } as T;
  },
};

const cards = ['full', 'mini'].map((id) => document.getElementById(id) as any);
cards[0].setConfig({ type: 'custom:omnium-music', entity: 'media_player.spotifyplus', height: 640 });
cards[1].setConfig({ type: 'custom:omnium-music', entity: 'media_player.spotifyplus', mode: 'mini' });

function push() {
  hass.states = { 'media_player.spotifyplus': player() };
  const h = { ...hass };
  for (const c of cards) c.hass = h;
}
push();
