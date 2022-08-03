const express = require('express');
const app = express();

const { type } = require('./config.js');
const { connectDb } = require('./sql');
const { andromedaAuthorization } = require('./authorization.js');
// const { getStartTime, submitStartTime } = require('./functions/runTimes.js');
const { sendErrorReport } = require('./functions/errorReporting.js');

const { getSQLServerData } = require('./sql');
const { getCurrentPODetailIds } = require('./andromeda');

const server = app.listen(6000, async () => {
  console.log('Andromeda Revisions is running...');
  const errors = [];
  try {
    await andromedaAuthorization();
    console.log('Authorization complete');
    await connectDb();

    const andromedaIds = await getCurrentPODetailIds();
    console.log(andromedaIds);
  } catch (err) {
    console.log(err);
    errors.push({
      err: err?.message,
    });
  }

  console.log(errors);
  // if (errors.flat().length) {
  //   await sendErrorReport(errors.flat(), type);
  // }

  process.kill(process.pid, 'SIGTERM');
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});
