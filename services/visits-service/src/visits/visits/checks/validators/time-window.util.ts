export function inCheckInWindow(now: Date, start: Date, end: Date, earlyMin: number) {
    const min = new Date(start.getTime() - earlyMin * 60 * 1000);
    return now >= min && now <= end;
}
export function inCheckOutWindow(now: Date, start: Date, end: Date, lateMin: number) {
    const max = new Date(end.getTime() + lateMin * 60 * 1000);
    return now >= start && now <= max;
}