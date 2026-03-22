import { memo } from 'react';
import type { PlayerInfo as PlayerInfoType, HudElements } from '../types';
import styles from '../styles/hud.module.css';

interface PlayerInfoProps {
  info: PlayerInfoType;
  elements: HudElements;
}

function formatMoney(amount: number): string {
  return '$' + amount.toLocaleString('en-US');
}

function PlayerInfoComponent({ info, elements }: PlayerInfoProps) {
  const hasContent = elements.cash || elements.bank || elements.job || elements.serverId;
  if (!hasContent) return null;

  return (
    <div className={styles.playerInfo}>
      {elements.serverId && info.serverId > 0 && (
        <span className={styles.infoTag}>ID: {info.serverId}</span>
      )}
      {elements.job && info.job && <span className={styles.infoTag}>{info.job}</span>}
      {elements.cash && <span className={styles.infoCash}>{formatMoney(info.cash)}</span>}
      {elements.bank && <span className={styles.infoBank}>{formatMoney(info.bank)}</span>}
    </div>
  );
}

export const PlayerInfoDisplay = memo(PlayerInfoComponent);
