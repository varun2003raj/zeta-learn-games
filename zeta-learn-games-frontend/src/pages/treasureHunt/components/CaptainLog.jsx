import { useEffect, useRef } from "react";

function CaptainLog({ logs }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section className="panel parchment-panel captain-log-panel">
      <header className="panel-header">
        <h2>Mission Feed</h2>
      </header>

      <div className="captain-log-stream" ref={containerRef}>
        {logs.map((entry) => (
          <p key={entry.id} className={`log-entry log-${entry.type}`}>
            <span className="log-time">[{entry.time}]</span>
            <span>{entry.text}</span>
          </p>
        ))}
      </div>
    </section>
  );
}

export default CaptainLog;
