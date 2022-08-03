const axios = require('axios');
const { url, idQuery } = require('./config.js');
const {
  getSQLServerData,
  submitAllQueries,
  submitQuery,
  getSQLServerDataByQuery,
} = require('./sql');

//Returns an array of all current ids for po details
const getCurrentPODetailIds = async () => {
  const { data } = await axios.post(`${url}/search/query/${idQuery}`);
  return data.map(({ id_productionorderdetail }) => id_productionorderdetail);
};

//Insert the po details that need to be deleted into a delete table in SQL Server and delete them from the original table
const insertAndDeleteDetails = async (arr) => {
  const errors = [];

  // //Insert all records into the delete table
  // const submitErrors = await submitAllQueries(
  //   arr,
  //   'ProductionOrderDetailDeletes',
  //   true
  // );

  // submitErrors.length && errors.push(submitErrors);

  //Get distinct records currently in the archive
  const currentArchive = await getSQLServerDataByQuery(
    `SELECT DISTINCT idPO, idPODetail, Style, Color FROM ProductionOrderDetailImportArchive`
  );

  //Get distinct ids currently in the archive
  const currentArchiveIds = currentArchive.map(({ idPODetail }) => idPODetail);

  //Get distinct records currently in the deletes
  const currentDeletes = await getSQLServerDataByQuery(
    `SELECT DISTINCT idPO, idPODetail, Style, Color FROM ProductionOrderDetailDeletes`
  );

  //Filter the deletes to only the records that have yet to be deleted from the archive
  const deleteFromArchive = currentDeletes.filter(({ idPODetail }) =>
    currentArchiveIds.includes(idPODetail)
  );

  //Delete records from the archive
  for (let i = 0; i < deleteFromArchive.length; ++i) {
    const record = deleteFromArchive[i];
    const { idPO, idPODetail, Style, Color } = record;
    try {
      await submitQuery(
        `DELETE FROM ProductionOrderDetailImportArchive WHERE idPODetail = '${idPODetail}'`
      );
      console.log(idPODetail);
    } catch (err) {
      errors.push({
        idPO,
        idPODetail,
        style: Style,
        color: Color,
        err: err?.message,
      });
    }
  }

  return errors.flat();
};

//Update the Production Import table with the correct idPODetail for records that have been deleted
const updateProductionImport = async () => {
  //Get all ids that have been deleted
  const deletedIds = await getSQLServerDataByQuery(
    'SELECT DISTINCT idPODetail FROM ProductionOrderDetailDeletes'
  );

  // //Put the ids into a WHERE clause format
  // const deleltedIdClause =
};

//Returns an array of objects retrieved from the DB of all ids of po details that have been deleted, but are still active in our DB
const getDeletedPODetails = async (ids) => {
  // //Get all current id po details from our DB
  // const sqlPODetails = await getSQLServerData(
  //   'ProductionOrderDetailImportArchive'
  //   //`WHERE MostRecent = 'Yes'`
  // );

  // //Find id po details that are in our DB, but are deleted from Andromeda
  // const deletedPODetails = sqlPODetails.filter(
  //   ({ idPODetail }) => !ids.includes(parseInt(idPODetail))
  // );

  // const insertAndDeleteErrors = await insertAndDeleteDetails(deletedPODetails);
  await updateProductionImport();
};

module.exports = {
  getCurrentPODetailIds,
  getDeletedPODetails,
};
