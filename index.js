const express = require('express');
const app = express();

const { type } = require('./config.js');
const { connectDb, executeProcedure } = require('./sql');
const { andromedaAuthorization } = require('./authorization.js');
const { sendErrorReport } = require('./functions/errorReporting.js');

const { getCurrentPODetailIds, deletePODetails } = require('./andromeda');

const server = app.listen(6026, async () => {
  console.log('Andromeda PO Detail Deletes is running...');
  const errors = [];
  try {
    // Connect to Andromeda and to SQL Server
    await andromedaAuthorization();
    console.log('Authorization complete');
    await connectDb();

    // Get the ids of all details currently in Andromeda
    const andromedaIds = await getCurrentPODetailIds();

    // Delete any ids that are not in Andromeda, but are in our Andromeda DB's
    const deleteErrors = await deletePODetails(andromedaIds);
    deleteErrors && errors.push(deleteErrors);

    // After detail rows have been deleted, send the production orders to ECHO-INT
    await executeProcedure('ProductionOrderExportToEHOINT'); 
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
