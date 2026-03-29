import { memo } from 'react';
import styles from './hud.module.css';

interface IdJobProps {
  playerId: number;
  jobLabel: string;
  visible: boolean;
  position: { top: number; right: number };
}

export const IdJob = memo(function IdJob({ playerId, jobLabel, visible, position }: IdJobProps) {
  return (
    <div
      className={`${styles.idJob} ${!visible ? styles.idJobHidden : ''}`}
      style={{ top: position.top, right: position.right }}
    >
      ID: {playerId} &middot; {jobLabel}
    </div>
  );
});
