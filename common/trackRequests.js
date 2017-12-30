const AWSXRay = require('aws-xray-sdk-core');

const mwUtils = AWSXRay.middleware;
const IncomingRequestData = mwUtils.IncomingRequestData;
const Segment = AWSXRay.Segment;

const koaMW = {

  trackRequests: function trackRequests(defaultName) {
    if (!defaultName || typeof defaultName !== 'string')
      throw new Error('Default segment name was not supplied.  Please provide a string.');

    AWSXRay.enableManualMode();
    mwUtils.setDefaultName(defaultName);

    function closeSegment(ctx, err) {
      const segment = AWSXRay.resolveSegment(ctx.segment);
      if(err) {
        segment.close(err);
        AWSXRay.getLogger().debug('Closed koa segment with error: { url: ' + ctx.url + ', name: ' + segment.name + ', trace_id: ' +
          segment.trace_id + ', id: ' + segment.id + ', sampled: ' + !segment.notTraced + ' }');
      } else {
        segment.close();
        AWSXRay.getLogger().debug('Closed koa segment successfully: { url: ' + ctx.url + ', name: ' + segment.name + ', trace_id: ' +
          segment.trace_id + ', id: ' + segment.id + ', sampled: ' + !segment.notTraced + ' }');
      }
    }

    return async function xRayMiddleware(ctx, next) {
      var amznTraceHeader = mwUtils.processHeaders(ctx);
      var name = mwUtils.resolveName(ctx.host);
      var segment = new Segment(name, amznTraceHeader.Root, amznTraceHeader.Parent);

      mwUtils.resolveSampling(amznTraceHeader, segment, ctx);
      segment.addIncomingRequestData(new IncomingRequestData(ctx));

      AWSXRay.getLogger().debug('Starting koa segment: { url: ' + ctx.url + ', name: ' + segment.name + ', trace_id: ' +
        segment.trace_id + ', id: ' + segment.id + ', sampled: ' + !segment.notTraced + ' }');

      try {
        ctx.segment = segment;
        await next(ctx);
      } catch(err) {
        closeSegment(ctx, err);
        throw err;
      }
      closeSegment(ctx);
    };
  },
};

// This is not fully tested (hard to test XRay integration)
module.exports = function(defaultName){
  if (!defaultName || typeof defaultName !== 'string') {
      throw new Error('Default segment name was not supplied.  Please provide a string.');
  }

  AWSXRay.enableManualMode();
  mwUtils.setDefaultName(defaultName);
  return trackRequestMiddleware;
};

async function trackRequestMiddleware(ctx, next) {
  const amznTraceHeader = mwUtils.processHeaders(ctx);
  const name = mwUtils.resolveName(ctx.host);
  ctx.segment = new Segment(name, amznTraceHeader.Root, amznTraceHeader.Parent);
  ctx.segment.addIncomingRequestData(new IncomingRequestData(ctx.req));

  try {
    ctx.segment = segment;
    await next(ctx);
  } catch(err) {
    closeSegment(ctx, err);
    throw err;
  }
  closeSegment(ctx);
}

function closeSegment(ctx, err) {
  const segment = AWSXRay.resolveSegment(ctx.segment);
  if(ctx._matchedRoute) {
    segment.addAnnotation('route', ctx._matchedRoute);
  }
  segment.http.close(ctx.res);
  segment.close(err);
}