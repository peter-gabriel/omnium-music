import type { Hass } from './types';
import { langOf, strings } from './i18n';

/** item da biblioteca (faixa, playlist, álbum) já no formato que o painel mostra */
export interface MediaItem {
  name: string;
  sub: string;
  image?: string;
  uri: string;
  kind: 'track' | 'playlist' | 'album' | 'artist';
}

export interface Library {
  recent: MediaItem[];
  liked: MediaItem[];
  playlists: MediaItem[];
}

/** o player é do SpotifyPlus? (só ele tem os serviços de biblioteca) */
export function hasSpotifyPlus(hass?: Hass) {
  return !!hass?.services?.spotifyplus;
}

async function call(hass: Hass, entity: string, service: string, data: Record<string, unknown> = {}) {
  const r = await hass.callWS<{ response: { result?: { items?: any[] } } }>({
    type: 'call_service',
    domain: 'spotifyplus',
    service,
    service_data: { entity_id: entity, ...data },
    return_response: true,
  });
  return r.response?.result?.items ?? [];
}

const img = (x: any): string | undefined => x?.image_url ?? x?.images?.[0]?.url ?? x?.album?.images?.[0]?.url;
const artists = (x: any) => (x?.artists ?? []).map((a: any) => a.name).join(', ');

function track(x: any): MediaItem {
  return { name: x.name, sub: artists(x), image: img(x) ?? img(x.album), uri: x.uri, kind: 'track' };
}

/** carrega recentes, curtidas e playlists; cada parte falha sozinha sem derrubar as outras */
export async function loadLibrary(hass: Hass, entity: string): Promise<Library> {
  const t = strings(langOf(hass));
  const safe = <T>(p: Promise<T>, fallback: T) => p.catch(() => fallback);
  const [recentRaw, likedRaw, playlistsRaw] = await Promise.all([
    safe(call(hass, entity, 'get_player_recent_tracks', { limit: 50 }), []),
    safe(call(hass, entity, 'get_track_favorites', { limit_total: 50 }), []),
    safe(call(hass, entity, 'get_playlist_favorites', { limit_total: 50 }), []),
  ]);
  // recentes repetem a mesma faixa; mantém a primeira ocorrência
  const seen = new Set<string>();
  const recent = recentRaw
    .map((i: any) => track(i.track ?? i))
    .filter((t) => t.uri && !seen.has(t.uri) && seen.add(t.uri));
  return {
    recent,
    liked: likedRaw.map((i: any) => track(i.track ?? i)).filter((t) => t.uri),
    playlists: playlistsRaw.map((p: any) => ({
      name: p.name,
      sub: p.owner?.display_name ?? t.songs(p.tracks?.total ?? ''),
      image: img(p),
      uri: p.uri,
      kind: 'playlist' as const,
    })),
  };
}

export async function playItem(hass: Hass, entity: string, item: MediaItem, queue?: MediaItem[]) {
  if (item.kind === 'track') {
    // toca a faixa e deixa as seguintes da mesma lista na fila
    const list = queue?.filter((q) => q.kind === 'track') ?? [item];
    const start = Math.max(0, list.findIndex((q) => q.uri === item.uri));
    const uris = list.slice(start, start + 50).map((q) => q.uri).join(',');
    await hass.callService('spotifyplus', 'player_media_play_tracks', { entity_id: entity, uris });
  } else {
    await hass.callService('spotifyplus', 'player_media_play_context', { entity_id: entity, context_uri: item.uri });
  }
}

export type SearchKind = 'track' | 'artist' | 'album' | 'playlist';

const SEARCH_SERVICE: Record<SearchKind, string> = {
  track: 'search_tracks',
  artist: 'search_artists',
  album: 'search_albums',
  playlist: 'search_playlists',
};

/** busca no catálogo do Spotify via SpotifyPlus */
export async function searchSpotify(hass: Hass, entity: string, kind: SearchKind, criteria: string): Promise<MediaItem[]> {
  const t = strings(langOf(hass));
  const items = await call(hass, entity, SEARCH_SERVICE[kind], { criteria, limit_total: 30 });
  return items
    .filter((x: any) => x?.uri)
    .map((x: any): MediaItem => {
      if (kind === 'track') return track(x);
      if (kind === 'artist')
        return {
          name: x.name,
          sub: x.followers?.total ? t.followers(Intl.NumberFormat(langOf(hass), { notation: 'compact' }).format(x.followers.total)) : t.artist,
          image: img(x),
          uri: x.uri,
          kind,
        };
      if (kind === 'album') return { name: x.name, sub: artists(x) || t.album, image: img(x), uri: x.uri, kind };
      return { name: x.name, sub: x.owner?.display_name ?? t.playlist, image: img(x), uri: x.uri, kind };
    });
}
