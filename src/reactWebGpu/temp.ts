/*
export function useMutableCallback<T>(fn: T) {
  const ref = React.useRef<T>(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);
  return ref;
}

export function useFrame(callback: RenderCallback, renderPriority = 0): null {
  const store = useStore();
  const subscribe = store.getState().internal.subscribe;
  // Memoize ref
  const ref = useMutableCallback(callback);
  // Subscribe on mount, unsubscribe on unmount
  useEffect(
    () => subscribe(ref, renderPriority, store),
    [renderPriority, subscribe, store],
  );
  return null;
}*/
