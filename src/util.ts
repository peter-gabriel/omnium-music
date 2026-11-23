import type { HassEntity } from './types';

export function fmtTime(sec?: number) {
  if (sec === undefined || !Number.isFinite(sec)) return '';
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** posição atual da música em segundos (o HA só atualiza media_position de vez em quando) */
export function position(st: HassEntity): number | undefined {
  const a = st.attributes;
  if (typeof a.media_position !== 'number') return undefined;
  let pos = a.media_position;
  if (st.state === 'playing' && a.media_position_updated_at) pos += (Date.now() - Date.parse(a.media_position_updated_at)) / 1000;
  return typeof a.media_duration === 'number' ? Math.min(pos, a.media_duration) : pos;
}

/** a caixa é a fonte atual do player? */
export function speakerIsCurrent(st: HassEntity | undefined, speaker?: string) {
  const src = st?.attributes.source;
  return !!speaker && typeof src === 'string' && src.trim().toLowerCase() === speaker.trim().toLowerCase();
}

/** aviso no padrão do HA (o frontend mostra como toast; quem embute o painel pode interceptar) */
export function notify(from: HTMLElement, message: string) {
  from.dispatchEvent(new CustomEvent('hass-notification', { detail: { message }, bubbles: true, composed: true }));
}
