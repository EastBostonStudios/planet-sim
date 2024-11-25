import { useEffect, useRef, useState } from "react";

export function useFireOnce<T>(func: (() => T) | undefined) {
  const hasFiredRef = useRef(false);
  const [result, setResult] = useState<T>();

  useEffect(() => {
    if (!hasFiredRef.current && !!func) {
      hasFiredRef.current = true;
      setResult(func());
    }
  }, [func]);

  return result;
}

export function useFireOnceAsync<T>(func: (() => Promise<T>) | undefined) {
  const hasFiredRef = useRef(false);
  const [result, setResult] = useState<T>();

  useEffect(() => {
    if (!hasFiredRef.current && !!func) {
      hasFiredRef.current = true;
      func().then(setResult);
    }
  }, [func]);

  return result;
}
