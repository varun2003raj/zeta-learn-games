import { useEffect, useRef, useState } from "react";
import {
  applyPublicThemeToDocument,
  getNextPublicThemeState,
  pickPublicThemeModel,
} from "../utils/publicTheme";

const DEFAULT_ROTATION_MS = 10000;

export default function useRotatingPublicTheme(rotationMs = DEFAULT_ROTATION_MS) {
  const [themeModel, setThemeModel] = useState(() => pickPublicThemeModel());
  const themePoolRef = useRef([]);

  useEffect(() => applyPublicThemeToDocument(themeModel), [themeModel]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setThemeModel((currentModel) => {
        const { model, pool } = getNextPublicThemeState(currentModel, themePoolRef.current);
        themePoolRef.current = pool;
        return model;
      });
    }, rotationMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [rotationMs]);

  return themeModel;
}

