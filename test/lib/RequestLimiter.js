'use strict';

const assert = require('assert');
const sinon = require('sinon');

const RequestLimiter = require('../../lib/RequestLimiter');

const context = {
  plugins: [],
  req: {
    _queries: {},
    _headers: {
      'User-Agent': 'http-transport/1.0.0'
    },
    _method: 'GET',
    _url: 'https://jsonplaceholder.typicode.com/posts/1'
  },
  res: {
    elapsedTime: 0,
    headers: {}
  }
}

const makeNext = (spy) => {
  return () => {
    return new Promise((resolve) => {
      spy();
      resolve();
    });
  }
}

describe('Request Limiter', () => {
  describe('.limit', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('returns a promise', (done) => {
      const requestLimiter = new RequestLimiter(10, 10);
      const requestLimiterPlugin = requestLimiter.limit.bind(requestLimiter);
      const next1 = makeNext(() => {});

      requestLimiterPlugin(context, next1).then(() => {
        done();
      });
    });

    it('limits requests', (done) => {
      const requestLimiter = new RequestLimiter(1, 10 * 1000);
      const requestLimiterPlugin = requestLimiter.limit.bind(requestLimiter);

      const spy1 = sinon.spy();
      const spy2 = sinon.spy();
      const next1 = makeNext(spy1);
      const next2 = makeNext(spy2);
      const request1 = requestLimiterPlugin(context, next1);
      const request2 = requestLimiterPlugin(context, next2);

      assert.ok(spy1.called);
      assert.ok(!spy2.called);

      clock.tick(10000);
      request2.then(done);
    });

    it('resets the counter correctly', (done) => {
      const requestLimiter = new RequestLimiter(2, 10 * 1000);
      const requestLimiterPlugin = requestLimiter.limit.bind(requestLimiter);

      const spy1 = sinon.spy();
      const spy2 = sinon.spy();
      const spy3 = sinon.spy();
      const spy4 = sinon.spy();
      const next1 = makeNext(spy1);
      const next2 = makeNext(spy2);
      const next3 = makeNext(spy3);
      const next4 = makeNext(spy4);
      const request1 = requestLimiterPlugin(context, next1);
      const request2 = requestLimiterPlugin(context, next2);
      const request3 = requestLimiterPlugin(context, next3);
      const request4 = requestLimiterPlugin(context, next4);

      assert.ok(spy1.called);
      assert.ok(spy2.called);
      assert.ok(!spy3.called);
      assert.ok(!spy4.called);

      clock.tick(10000);

      request3.then(() => {
        assert.ok(spy3.called);
      });

      request4.then(() => {
        assert.ok(spy4.called);
        const spy5 = sinon.spy();
        const spy6 = sinon.spy();
        const spy7 = sinon.spy();
        const next5 = makeNext(spy5);
        const next6 = makeNext(spy6);
        const next7 = makeNext(spy7);
        const request5 = requestLimiterPlugin(context, next5);
        const request6 = requestLimiterPlugin(context, next6);
        const request7 = requestLimiterPlugin(context, next7);

        clock.tick(10000);
        assert.ok(!spy5.called);
        assert.ok(!spy6.called);
        assert.ok(!spy7.called);

        request5.then(() => {
          assert.ok(spy5.called);
          request6.then(() => {
            assert.ok(spy6.called);
            done();
          });
        });
      });

    });

    it('waits the correct amount of time when limiting', (done) => {
      const requestLimiter = new RequestLimiter(1, 10 * 1000);
      const requestLimiterPlugin = requestLimiter.limit.bind(requestLimiter);

      const spy1 = sinon.spy();
      const spy2 = sinon.spy();
      const next1 = makeNext(spy1);
      const next2 = makeNext(spy2);
      const request1 = requestLimiterPlugin(context, next1);
      const request2 = requestLimiterPlugin(context, next2);

      assert.ok(spy1.called);
      assert.ok(!spy2.called);

      clock.tick(9999);
      assert.ok(!spy2.called);
      clock.tick(1);
      request2.then(() => {
        assert.ok(spy2.called);
        done();
      });
    });

    it('resets the timer correctly', (done) => {
      const requestLimiter = new RequestLimiter(2, 10 * 1000);
      const requestLimiterPlugin = requestLimiter.limit.bind(requestLimiter);

      const spy1 = sinon.spy();
      const spy2 = sinon.spy();
      const spy3 = sinon.spy();
      const next1 = makeNext(spy1)
      const next2 = makeNext(spy2)
      const next3 = makeNext(spy3)
      const request1 = requestLimiterPlugin(context, next1);

      clock.tick(10000);
      const request2 = requestLimiterPlugin(context, next2);
      const request3 = requestLimiterPlugin(context, next3);

      assert.ok(spy1.called);
      assert.ok(spy2.called);
      assert.ok(spy3.called);
      done();
    });
  });
});
