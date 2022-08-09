const express = require('express');
const app = express();

const { type } = require('./config.js');
const { connectDb } = require('./sql');
const { andromedaAuthorization } = require('./authorization.js');
const { sendErrorReport } = require('./functions/errorReporting.js');

const { getCurrentPODetailIds, deletePODetails } = require('./andromeda');

const server = app.listen(6026, async () => {
  console.log('Andromeda PO Detail Deletes is running...');
  const errors = [];
  try {
    await andromedaAuthorization();
    console.log('Authorization complete');
    await connectDb();

    const andromedaIds = await getCurrentPODetailIds();
    const deleteErrors = await deletePODetails(andromedaIds);
    deleteErrors && errors.push(deleteErrors);
  } catch (err) {
    errors.push({
      err: err?.message,
    });
  }

  if (errors.flat().length) {
    await sendErrorReport(errors.flat(), type);
  }

  process.kill(process.pid, 'SIGTERM');
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});
