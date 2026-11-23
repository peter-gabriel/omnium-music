import { describe, expect, it } from 'vitest';
import { loadLibrary, searchSpotify } from '../src/spotify';
import { strings } from '../src/i18n';
import { fmtTime, position, speakerIsCurrent } from '../src/util';
import type { Hass } from '../src/types';

/** fake hass whose SpotifyPlus services answer from a table */
function fakeHass(answers: Record<string, unknown[]>, language = 'en'): Hass {
  return {
    states: {},
    language,
    services: { spotifyplus: {} },
    async callService() {},
    async callWS<T>(msg: Record<string, unknown>) {
      return { response: { result: { items: answers[String(msg.service)] ?? [] } } } as T;
    },
  };
}

const track = (n: number) => ({
  name: `Song ${n}`,
  uri: `spotify:track:${n}`,
  artists: [{ name: 'Artist A' }, { name: 'Artist B' }],
  album: { images: [{ url: `https://example.com/${n}.jpg` }] },
});

describe('loadLibrary', () => {
  it('keeps the first play of repeated recent tracks', async () => {
    const hass = fakeHass({ get_player_recent_tracks: [{ track: track(1) }, { track: track(2) }, { track: track(1) }] });
    const lib = await loadLibrary(hass, 'media_player.x');
    expect(lib.recent.map((t) => t.uri)).toEqual(['spotify:track:1', 'spotify:track:2']);
    expect(lib.recent[0]).toMatchObject({ sub: 'Artist A, Artist B', image: 'https://example.com/1.jpg', kind: 'track' });
  });

  it('does not fail when one service fails', async () => {
    const hass = fakeHass({ get_track_favorites: [{ track: track(3) }] });
    hass.callWS = async <T>(msg: Record<string, unknown>) => {
      if (msg.service === 'get_player_recent_tracks') throw new Error('boom');
      return { response: { result: { items: msg.service === 'get_track_favorites' ? [{ track: track(3) }] : [] } } } as T;
    };
    const lib = await loadLibrary(hass, 'media_player.x');
    expect(lib.recent).toEqual([]);
    expect(lib.liked).toHaveLength(1);
  });
});

describe('searchSpotify', () => {
  it('labels artists with localized followers', async () => {
    const hass = fakeHass({ search_artists: [{ name: 'Band', uri: 'spotify:artist:1', followers: { total: 1500 } }] }, 'pt-BR');
    const [a] = await searchSpotify(hass, 'media_player.x', 'artist', 'band');
    expect(a.kind).toBe('artist');
    expect(a.sub).toMatch(/seguidores$/);
  });

  it('drops results without uri', async () => {
    const hass = fakeHass({ search_tracks: [track(1), { name: 'broken' }] });
    expect(await searchSpotify(hass, 'media_player.x', 'track', 'x')).toHaveLength(1);
  });
});

describe('i18n', () => {
  it('picks the language by prefix and falls back to English', () => {
    expect(strings('pt-BR').tabSpeakers).toBe('Caixas');
    expect(strings('es-AR').tabSpeakers).toBe('Altavoces');
    expect(strings('de').tabSpeakers).toBe('Speakers');
    expect(strings(undefined).tabSpeakers).toBe('Speakers');
  });

  it('has every key in every language', () => {
    const keys = Object.keys(strings('en')).sort();
    expect(Object.keys(strings('pt')).sort()).toEqual(keys);
    expect(Object.keys(strings('es')).sort()).toEqual(keys);
  });
});

describe('util', () => {
  it('formats time', () => {
    expect(fmtTime(0)).toBe('0:00');
    expect(fmtTime(214)).toBe('3:34');
    expect(fmtTime(undefined)).toBe('');
  });

  it('advances the position while playing, capped at the duration', () => {
    const at = new Date(Date.now() - 10_000).toISOString();
    const st = (state: string) => ({
      entity_id: 'media_player.x',
      state,
      attributes: { media_position: 200, media_duration: 205, media_position_updated_at: at },
    });
    expect(position(st('paused'))).toBe(200);
    expect(position(st('playing'))).toBe(205);
  });

  it('matches speakers ignoring case and spaces', () => {
    const st = { entity_id: 'm', state: 'playing', attributes: { source: ' Living Room ' } };
    expect(speakerIsCurrent(st, 'living room')).toBe(true);
    expect(speakerIsCurrent(st, 'Kitchen')).toBe(false);
  });
});
