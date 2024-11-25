import { useEffect, useRef, useState } from "react";

export default function useFireOnce<T>(func: (() => Promise<T>) | undefined) {
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
