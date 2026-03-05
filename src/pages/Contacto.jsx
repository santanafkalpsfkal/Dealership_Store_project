import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import s from './Contacto.module.css';

const ADVISOR = {
  name:   'Laura Sánchez',
  role:   'Asesora de Ventas',
  id:     'Asesor #B8310i',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332e3c6?w=200',
};

const INITIAL_MSGS = [
  { from: 'advisor', text: '¡Hola! ¿En qué puedo ayudarte? 😊', time: '14:32' },
  { from: 'user',    text: 'Estoy interesado en una Ducati Panigale V2S', time: '14:33' },
  { from: 'advisor', text: '¡Excelente elección, es una moto increíble! 🏍️', time: '14:33' },
];

const QUICK_REPLIES = [
  'Quiero más información',
  'Simular financiamiento',
  'Ver disponibilidad',
  'Agendar cita',
];

export default function ContactoPage() {
  const navigate = useNavigate();
  const [msgs,  setMsgs]  = useState(INITIAL_MSGS);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  const sendMsg = (text) => {
    if (!text.trim()) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

    setMsgs(prev => [...prev, { from: 'user', text, time }]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      setMsgs(prev => [...prev, {
        from: 'advisor',
        text: '¡Gracias por tu mensaje! Un asesor te contactará en breve. También puedes escribirnos por WhatsApp para una respuesta más rápida. 🚀',
        time,
      }]);
    }, 1800);
  };

  return (
    <main className={s.page}>

      <div className={s.layout}>

        {/* ── Chat ── */}
        <div className={s.chatBox}>
          {/* Advisor header */}
          <div className={s.advisorHeader}>
            <div className={s.advisorImgWrap}>
              <img src={ADVISOR.avatar} alt={ADVISOR.name} className={s.advisorImg}
                onError={e => { e.target.src = ''; e.target.style.display='none'; }}/>
              <span className={s.onlineDot} />
            </div>
            <div className={s.advisorInfo}>
              <p className={s.advisorName}>
                <strong>{ADVISOR.name.split(' ')[0]}</strong> {ADVISOR.name.split(' ').slice(1).join(' ')}
                <span className={s.advisorRole}> Asesora</span>
              </p>
              <p className={s.advisorId}>{ADVISOR.id}</p>
            </div>
            <div className={s.advisorActions}>
              <button className={s.actionBtn}>📧</button>
              <button className={s.actionBtn}>📞</button>
              <button className={s.actionBtn}>👤</button>
            </div>
          </div>

          {/* Messages */}
          <div className={s.messages} ref={messagesRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`${s.msgRow} ${m.from === 'user' ? s.msgRowUser : ''}`}>
                {m.from === 'advisor' && (
                  <div className={s.msgAvatar}>
                    <img src={ADVISOR.avatar} alt="" className={s.msgAvatarImg}
                      onError={e => { e.target.style.display='none'; }} />
                  </div>
                )}
                <div className={`${s.bubble} ${m.from === 'user' ? s.bubbleUser : s.bubbleAdvisor}`}>
                  <p>{m.text}</p>
                  <span className={s.msgTime}>{m.time} {m.from === 'user' && '✓✓'}</span>
                </div>
              </div>
            ))}
            {typing && (
              <div className={s.msgRow}>
                <div className={s.msgAvatar}>
                  <img src={ADVISOR.avatar} alt="" className={s.msgAvatarImg} />
                </div>
                <div className={`${s.bubble} ${s.bubbleAdvisor} ${s.typingBubble}`}>
                  <span className={s.dot} /><span className={s.dot} /><span className={s.dot} />
                </div>
              </div>
            )}
          </div>

          {/* Quick replies */}
          <div className={s.quickReplies}>
            {QUICK_REPLIES.map(r => (
              <button key={r} className={s.quickBtn} onClick={() => sendMsg(r)}>{r}</button>
            ))}
          </div>

          {/* Input */}
          <div className={s.inputRow}>
            <input
              className={s.input}
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg(input)}
            />
            <button className={s.sendBtn} onClick={() => sendMsg(input)}>
              Enviar
            </button>
            <button className={s.waBtn} onClick={() => window.open('https://wa.me/573000000000', '_blank')}>
              <span>🟢</span> WhatsApp
            </button>
          </div>
        </div>

        {/* ── Sidebar info ── */}
        <div className={s.sideInfo}>
          <div className={s.advisorCard}>
            <img src={ADVISOR.avatar} alt="" className={s.sideAvatar}
              onError={e => { e.target.style.background='var(--surface3)'; e.target.src=''; }} />
            <h3 className={s.sideAdvisorName}>{ADVISOR.name}</h3>
            <p className={s.sideAdvisorRole}>{ADVISOR.role}</p>
            <span className={s.onlineBadge}>● Disponible ahora</span>
            <p className={s.responseTime}>Tiempo de respuesta: &lt; 5 min</p>
          </div>

          <div className={s.contactMethods}>
            <h4 className={s.contactMethodsTitle}>Canales de contacto</h4>
            {[
              { icon: '💬', label: 'WhatsApp', sub: '+57 300 000 0000', action: () => window.open('https://wa.me/573000000000') },
              { icon: '📧', label: 'Email',     sub: 'ventas@motorplace.co', action: () => {} },
              { icon: '📞', label: 'Teléfono',  sub: '+57 (1) 234 5678',   action: () => {} },
              { icon: '📍', label: 'Sucursal',  sub: 'Bogotá · Medellín · Cali', action: () => {} },
            ].map(c => (
              <button key={c.label} className={s.contactMethod} onClick={c.action}>
                <span className={s.contactIcon}>{c.icon}</span>
                <div>
                  <p className={s.contactLabel}>{c.label}</p>
                  <p className={s.contactSub}>{c.sub}</p>
                </div>
              </button>
            ))}
          </div>

          <button className={s.catalogBtn} onClick={() => navigate('/catalogo')}>
            🏍️ Ver Catálogo →
          </button>
        </div>

      </div>
    </main>
  );
}
