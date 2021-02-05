const express = require('express');
const morgan = require('morgan');

const app = express();

const coreRoute = require('./routes/core');
const dutyRoute = require('./routes/duty');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 1 * 1000, // 1 second
    max: 3 // limit each IP to 10 requests per windowMs
  });

app.use(limiter);
app.use(morgan('dev'));
app.use('/', coreRoute);
app.use('/duty', dutyRoute);
app.use((req, res, next) => {
    const err = new Error("Page not found")
    err.status = 404
    next(err)
});

module.exports = app;