type WheelInput = {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  timeStamp: number;
};

/** Allow sustained scrolling without rapidly skipping through sections. */
export function createWheelNavigation() {
  let lastEventTime = -Infinity;
  let lastMoveTime = -Infinity;
  let distance = 0;

  return (event: WheelInput, pageHeight: number): -1 | 0 | 1 => {
    if (event.timeStamp - lastEventTime > 120) {
      distance = 0;
      lastMoveTime = -Infinity;
    }
    lastEventTime = event.timeStamp;
    if (event.timeStamp - lastMoveTime < 420) return 0;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? pageHeight : 1;
    if (Math.sign(distance) !== Math.sign(delta)) distance = 0;
    distance += delta * unit;
    if (Math.abs(distance) < 24) return 0;

    const direction = distance > 0 ? 1 : -1;
    lastMoveTime = event.timeStamp;
    distance = 0;
    return direction;
  };
}
