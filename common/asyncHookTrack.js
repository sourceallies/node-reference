
const async_hooks = require('async_hooks');
const AWSXRay = require('aws-xray-sdk-core');
const fs = require('fs');

const mwUtils = AWSXRay.middleware;
const IncomingRequestData = mwUtils.IncomingRequestData;
const Segment = AWSXRay.Segment;

module.exports = function (defaultName) {
    if (!defaultName || typeof defaultName !== 'string') {
        throw new Error('Default segment name was not supplied.  Please provide a string.');
    }

    mwUtils.setDefaultName(defaultName);



    /*
        function init(asyncId, type, triggerAsyncId, resource) {
        }
        function before(asyncId) {
            let segment = segmentsByAsyncId[asyncId];
            fs.writeSync(1, `before: ${asyncId} ${segment}\n`);
            if(segment) {
                AWSXRay.setSegment(segment);
            }
        }
        function after(asyncId) {
        }
        function destroy(asyncId) {
        }
    
        //const asyncHook = async_hooks.createHook({
          //  init,
         //   before,
           // after,
           // destroy
        //});
        //asyncHook.enable();
        */

    const contextUtils = require('aws-xray-sdk-core/lib/context_utils');
    const segmentsByAsyncId = {};
    AWSXRay.setSegment = contextUtils.setSegment = function (segment) {
        let asyncId = async_hooks.executionAsyncId();
        AWSXRay.getLogger().debug(`Setting segment for asyncId ${asyncId} to ${segment}`);
        if (segment) {
            segmentsByAsyncId[asyncId] = segment;
        } else {
            delete segmentsByAsyncId[asyncId];
        }
    };
    AWSXRay.getSegment = contextUtils.getSegment = function () {
        let asyncId = async_hooks.executionAsyncId();
        let segment = segmentsByAsyncId[asyncId];
        AWSXRay.getLogger().debug(`Returning segment ${segment} for asyncId ${asyncId}`);
        if (!segment) {
            throw new Error(`No segment found for async id ${asyncId}`);
        }
        return segment;
    };

    function closeSegment(ctx, err) {
        const segment = AWSXRay.resolveSegment(ctx.segment);
        if (ctx._matchedRoute) {
            segment.addAnnotation('route', ctx._matchedRoute);
        }
        segment.http.close(ctx.res);
        segment.close(err);
        AWSXRay.setSegment(null);
    }

    async function trackRequestMiddleware(ctx, next) {
        const amznTraceHeader = mwUtils.processHeaders(ctx);
        const name = mwUtils.resolveName(ctx.host);
        ctx.segment = new Segment(name, amznTraceHeader.Root, amznTraceHeader.Parent);
        ctx.segment.addIncomingRequestData(new IncomingRequestData(ctx.req));

        AWSXRay.setSegment(ctx.segment);
        try {
            await next(ctx);
        } catch (err) {
            closeSegment(ctx, err);
            throw err;
        } finally {
            delete segmentsByAsyncId[asyncId];
        }
        closeSegment(ctx);
    }

    return trackRequestMiddleware;
};

