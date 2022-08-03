const sql = require('mssql');
const { server, database, sqlUser, sqlPass } = require('./config.js');

const pool = new sql.ConnectionPool({
  user: sqlUser,
  password: sqlPass,
  server,
  database,
  trustServerCertificate: true,
  requestTimeout: 500000,
});

const connectDb = async () => {
  await pool.connect();
  return 'Complete';
};

const getLastRunTime = async (program) => {
  try {
    const res = await pool.query(
      `SELECT TOP 1 * FROM AndromedaSchedule WHERE Program = '${program}' ORDER BY LastRunTime DESC`
    );
    return res?.recordset;
  } catch (err) {
    return `Error: ${err?.message}`;
  }
};

const getSQLServerData = async (table, where) => {
  const query = `SELECT * FROM ${table} ${where ? where : ''}`;
  try {
    const res = await pool.query(query);
    return res?.recordset;
  } catch (err) {
    return `Error: ${err?.message}`;
  }
};

const insertTableStatement = (table, fields, values) => {
  return `SELECT *
    INTO ${table}
    FROM (VALUES ${values}) t1 ${fields}`;
};

const insertStatement = (table, fields, values) => {
  return `INSERT INTO ${table} SELECT * FROM (VALUES ${values}) t1 ${fields}`;
};

const executeProcedure = async (proc) => {
  try {
    await pool.request().execute(proc);
    return 'Complete';
  } catch (err) {
    return `Error: ${err?.message}`;
  }
};

const submitQuery = async (query) => {
  try {
    await pool.query(query);
    return 'Complete';
  } catch (err) {
    return `Error: ${err?.message}`;
  }
};

const submitAllQueries = async (fn, data, table, fields) => {
  const errors = [];
  for (let i = 0; i < data.length; ++i) {
    const values = await fn(data[i]);
    const query = insertStatement(table, fields, values);
    const res = await submitQuery(query);
    if (res.indexOf('Error') !== -1) {
      errors.push({ query, err: res, type: table });
    }
  }
  return errors;
};

module.exports = {
  connectDb,
  getLastRunTime,
  getSQLServerData,
  executeProcedure,
  submitQuery,
  submitAllQueries,
};
