/** o mínimo do objeto `hass` do Home Assistant que o painel usa */
export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed?: string;
}

export interface Hass {
  states: Record<string, HassEntity>;
  services?: Record<string, Record<string, unknown>>;
  language?: string;
  locale?: { language?: string };
  callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
  callWS<T = any>(msg: Record<string, unknown>): Promise<T>;
}

/** config do card no Lovelace */
export interface PanelCardConfig {
  type: string;
  entity: string;
  /** full: painel completo; mini: só o "tocando agora" (toque abre o completo) */
  mode?: 'full' | 'mini';
  /** altura do painel completo (px ou CSS); padrão 600px */
  height?: number | string;
  /** card de terceiros para o botão "Spotify completo" (ex.: custom:spotifyplus-card) */
  card?: Record<string, unknown>;
}
