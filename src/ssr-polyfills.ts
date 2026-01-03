// Tell TS we are intentionally emulating browser RAF
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback): number => {
    return setTimeout(() => cb(Date.now()), 0) as unknown as number;
  }) as typeof requestAnimationFrame;
}

if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  globalThis.cancelAnimationFrame = ((id: number) => {
    clearTimeout(id as unknown as NodeJS.Timeout);
  }) as typeof cancelAnimationFrame;
}
