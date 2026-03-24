import { memo } from 'react';
import type { PlayerInfo, HudElements } from '../types';
import styles from '../styles/hud.module.css';

interface InfoPillsProps {
  info: PlayerInfo;
  elements: HudElements;
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US');
}

function InfoPillsComponent({ info, elements }: InfoPillsProps) {
  const hasContent =
    elements.cash || elements.bank || elements.job || elements.serverId;
  if (!hasContent) return null;

  return (
    <div className={styles.infoCorner}>
      {elements.serverId && info.serverId > 0 && (
        <span className={styles.infoPill}>ID: {info.serverId}</span>
      )}
      {elements.job && info.job && (
        <span className={styles.infoPill}>{info.job}</span>
      )}
      {(elements.cash || elements.bank) && (
        <div className={styles.moneyPill}>
          {elements.cash && (
            <div className={`${styles.moneyRow} ${styles.cash}`}>
              <span className={styles.moneySymbol}>$</span>
              {formatMoney(info.cash)}
            </div>
          )}
          {elements.bank && (
            <div className={`${styles.moneyRow} ${styles.bank}`}>
              <span className={styles.moneySymbol}>$</span>
              {formatMoney(info.bank)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const InfoPills = memo(InfoPillsComponent);
