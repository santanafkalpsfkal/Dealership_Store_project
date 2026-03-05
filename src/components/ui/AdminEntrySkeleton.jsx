import s from './AdminEntrySkeleton.module.css';

export default function AdminEntrySkeleton() {
  return (
    <main className={s.page}>
      <section className={s.header}>
        <div className={s.kicker} />
        <div className={s.title} />
        <div className={s.subtitle} />
      </section>

      <section className={s.stats}>
        {[1, 2, 3, 4].map((n) => (
          <article key={n} className={s.card}>
            <div className={s.lineSm} />
            <div className={s.lineLg} />
          </article>
        ))}
      </section>

      <section className={s.grid}>
        <div className={s.form}>
          <div className={s.formHead} />
          <div className={s.fields}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={s.input} />
            ))}
            <div className={`${s.input} ${s.full}`} />
            <div className={`${s.input} ${s.full} ${s.textarea}`} />
          </div>
          <div className={s.button} />
        </div>

        <aside className={s.side}>
          <div className={s.lineLg} />
          <div className={s.lineSm} />
          <div className={s.lineSm} />
          <div className={s.lineSm} />
        </aside>
      </section>
    </main>
  );
}
