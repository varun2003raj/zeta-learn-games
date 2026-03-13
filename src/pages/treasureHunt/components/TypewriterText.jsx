/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

function TypewriterText({ text, speed = 12, className = "" }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setVisibleText(text);
      return undefined;
    }

    setVisibleText("");

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setVisibleText(text.slice(0, index));

      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return <p className={className}>{visibleText}</p>;
}

export default TypewriterText;
