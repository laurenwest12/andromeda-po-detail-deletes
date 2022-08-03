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

const getValues = (obj, timestamp) => {
  const values = Object.values(obj);
  const sqlString = values.reduce((acc, value, index) => {
    typeof value === 'string' && value.replaceAll("'", "''");
    if (typeof value === 'object') {
      acc += `'${value.toISOString()}',`;
    } else if (index === values.length - 1 && timestamp) {
      acc += `'${value}', CURRENT_TIMESTAMP)`;
    } else if (index === values.length - 1) {
      acc += `'${value}')`;
    } else {
      acc += `'${value}',`;
    }
    return acc;
  }, `(`);
  return sqlString;
};

const insertStatement = (table, values) => {
  return `INSERT INTO ${table} VALUES ${values}`;
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

const submitAllQueries = async (data, table, timestamp = false) => {
  const errors = [];
  for (let i = 0; i < data.length; ++i) {
    const values = await getValues(data[i], timestamp);
    const query = insertStatement(table, values);
    const res = await submitQuery(query);
    if (res.indexOf('Error') !== -1) {
      errors.push({ query, err: res });
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
