
const NANOSECONDS_IN_MS = 1e6;
const MS_IN_SECOND = 1000;

module.exports = function getElapsedDurationInMs(startHrTime) {
    const [seconds, nanoseconds] = process.hrtime(startHrTime);
    return (seconds * MS_IN_SECOND) + (nanoseconds / NANOSECONDS_IN_MS);
};