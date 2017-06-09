'use strict';
module.exports = class RequestLimiter {
  delay(sleep) {
    return new Promise((resolve) => {
      setTimeout(() => {
          resolve();
        },
        sleep);
    });
  }

  constructor(maxCount, countDuration) {
    this._maxCount = maxCount;
    this._countDuration = countDuration;
    this._counter = 0;
    this._queueSize = 0;
    this._counterResetTime = Date.now();
  }

  resetCounter() {
    this._counter = this._queueSize;
    this._counterResetTime = Date.now();
  }

  limit(ctx, next) {
    const withinCountLimit = this._counter < this._maxCount;
    const withinCountDuration = (Date.now() - this._counterResetTime) < this._countDuration;
    this._counter++;
    const reqId = this._counter;

    if (withinCountLimit && !withinCountDuration) {
      this.resetCounter();
      return next();
    } else if (!withinCountLimit) {
      const nextReset = (this._counterResetTime + this._countDuration) - Date.now();
      const queuesInCount = Math.floor(this._queueSize / this._maxCount);
      console.log(queuesInCount);

      const waitTime = queuesInCount < 1 ? nextReset : queuesInCount * (nextReset + this._countDuration)
      console.log(waitTime, nextReset);

      this._queueSize++;

      const delayedNext = this.delay(waitTime).then(() => {
        // this._queueSize--;
        return next();
      });

      return delayedNext;
    } else {
      return next();
    }
  }
}
