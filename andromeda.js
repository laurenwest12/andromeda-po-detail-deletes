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

  //Insert all records into the delete table
  const submitErrors = await submitAllQueries(
    arr,
    'ProductionOrderDetailDeletes',
    true
  );

  submitErrors.length && errors.push(submitErrors);

  //Get distinct records
  const deleteFromArchive = await getSQLServerDataByQuery(
    `SELECT DISTINCT idPO, idPODetail, Style, Color FROM ProductionOrderDetailDeletes`
  );

  //Delete records from the archive
  for (let i = 0; i < deleteFromArchive.length; ++i) {
    const record = deleteFromArchive[i];
    const { idPO, idPODetail, Style, Color } = record;
    try {
      await submitQuery(
        `DELETE FROM ProductionOrderDetailImportArchive WHERE idPODetail = '${idPODetail}'`
      );
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

// const updateProductionImport = async (arr) => {
//   for (let i = 0; i < arr.length; ++i) {
//     const { idPODetail } = arr[i];
//     const productionOrderToUpdate = await getSQLServerData(
//       `[Andromeda-UpTo].[dbo].[ProductionOrdersImport]`,
//       `WHERE idPODetail = '${idPODetail}'`
//     );
//     console.log(productionOrderToUpdate);
//   }
// };

//Returns an array of objects retrieved from the DB of all ids of po details that have been deleted, but are still active in our DB
const getDeletedPODetails = async (ids) => {
  //Get all current id po details from our DB
  const sqlPODetails = await getSQLServerData(
    'ProductionOrderDetailImportArchive'
    //`WHERE MostRecent = 'Yes'`
  );

  //Find id po details that are in our DB, but are deleted from Andromeda
  const deletedPODetails = sqlPODetails.filter(
    ({ idPODetail }) => !ids.includes(parseInt(idPODetail))
  );

  await insertAndDeleteDetails(deletedPODetails);
  // // await updateProductionImport(deletedPODetails);
};

module.exports = {
  getCurrentPODetailIds,
  getDeletedPODetails,
};
