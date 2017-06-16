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
      const requestLimiter = new RequestLimiter(1, 10 * 1000);
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

      assert.ok(spy1.called);
      assert.ok(!spy2.called);
      assert.ok(!spy3.called);

      clock.tick(10000);

      request2.then(() => {
        assert.ok(spy2.called);
        clock.tick(10000);
        request3.then(() => {
          assert.ok(spy3.called);
          const request4 = requestLimiterPlugin(context, next4);
          clock.tick(10000);
          request4.then(() => {
            assert.ok(spy4.called);
            done()
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
