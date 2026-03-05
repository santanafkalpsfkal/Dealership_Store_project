import { useApp } from '../../context/AppContext';
import s from './Toast.module.css';

export default function Toast() {
  const { notif } = useApp();
  return (
    <div className={`${s.toast} ${notif.show ? s.show : ''} ${s[notif.type] || ''}`}>
      {notif.type === 'success' && '✅ '}
      {notif.type === 'info'    && 'ℹ️ '}
      {notif.type === 'warning' && '⚠️ '}
      {notif.type === 'error'   && '⛔ '}
      {notif.text}
    </div>
  );
}
