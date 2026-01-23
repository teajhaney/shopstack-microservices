
const express = require('express');
const app = express();
app.use(express.json());

const target = require('./apps/gateway/src/gateway.controller');

// Helper to find express app or router in exports
function findAppOrRouter(mod) {
    if (mod.default) mod = mod.default;
    // Check if it looks like an app or router (function with handle, use, or verbs)
    if (typeof mod === 'function' || (mod && typeof mod.use === 'function')) {
        return mod;
    }
    // Search properties
    for (const key in mod) {
        if (typeof mod[key] === 'function' || (mod[key] && typeof mod[key].use === 'function')) {
            return mod[key];
        }
    }
    return null;
}

const detected = findAppOrRouter(target);

if (detected) {
    // If it's a router, mount it
    // How to know if it's a router or app?
    // app.listen is a function on App but not Router (usually).
    if (typeof detected.listen === 'function' && detected.mountpath === '/') { 
         // It's likely an app. If it's already listening, this might fail or we double listen? 
         // We'll try to listen.
         console.log('Detected App, starting...');
         detected.listen(3674, () => console.log('Server started on 3674'));
    } else {
        // Assume Router
        console.log('Detected Router or Middleware, mounting to / ...');
        app.use('/', detected);
        app.listen(3674, () => console.log('Server started on 3674'));
    }
} else {
    console.log('Could not detect exported App or Router. Running file for side-effects...');
    // Maybe the file calls listen itself?
    // We wait.
}
