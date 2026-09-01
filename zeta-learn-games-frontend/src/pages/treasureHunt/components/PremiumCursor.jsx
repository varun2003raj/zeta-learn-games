import { useEffect, useRef } from "react";

function PremiumCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!supportsFinePointer) {
      return undefined;
    }

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;
    let rafId = 0;

    const updateCursor = () => {
      ringX += (pointerX - ringX) * 0.16;
      ringY += (pointerY - ringY) * 0.16;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      rafId = window.requestAnimationFrame(updateCursor);
    };

    const showCursor = () => {
      dotRef.current?.classList.add("is-visible");
      ringRef.current?.classList.add("is-visible");
    };

    const hideCursor = () => {
      dotRef.current?.classList.remove("is-visible");
      ringRef.current?.classList.remove("is-visible");
    };

    const handleMove = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      showCursor();
    };

    const handlePressStart = () => {
      ringRef.current?.classList.add("is-pressed");
    };

    const handlePressEnd = () => {
      ringRef.current?.classList.remove("is-pressed");
    };

    const handleMouseOver = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const interactive = target?.closest("a, button, input, textarea, select, [role='button']");
      const isHovering = Boolean(interactive);
      ringRef.current?.classList.toggle("is-hovering", isHovering);
      dotRef.current?.classList.toggle("is-hovering", isHovering);
    };

    const handleWindowMouseOut = (event) => {
      if (!event.relatedTarget) {
        hideCursor();
      }
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mousedown", handlePressStart);
    window.addEventListener("mouseup", handlePressEnd);
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("blur", hideCursor);
    window.addEventListener("mouseout", handleWindowMouseOut);

    rafId = window.requestAnimationFrame(updateCursor);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handlePressStart);
      window.removeEventListener("mouseup", handlePressEnd);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("blur", hideCursor);
      window.removeEventListener("mouseout", handleWindowMouseOut);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <span ref={ringRef} className="premium-cursor-ring" aria-hidden="true" />
      <span ref={dotRef} className="premium-cursor-dot" aria-hidden="true" />
    </>
  );
}

export default PremiumCursor;
