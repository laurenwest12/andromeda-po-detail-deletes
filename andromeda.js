const axios = require('axios');
const { url, idQuery } = require('./config.js');
const { getSQLServerData, submitAllQueries } = require('./sql');

//Returns an array of all current ids for po details
const getCurrentPODetailIds = async () => {
  const { data } = await axios.post(`${url}/search/query/${idQuery}`);
  return data.map(({ id_productionorderdetail }) => id_productionorderdetail);
};

//Insert the po details that need to be deleted into a delete table in SQL Server and delete them from the original table
const insertAndDeleteDetails = async (arr) => {
  const submitErrors = await submitAllQueries(
    arr,
    'ProductionOrderDetailDeletes',
    true
  );
  console.log(submitErrors);
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
    'ProductionOrderDetailImportArchive',
    `WHERE MostRecent = 'Yes'`
  );

  //Find id po details that are in our DB, but are deleted from Andromeda
  const deletedPODetails = sqlPODetails.filter(
    ({ idPODetail }) => !ids.includes(parseInt(idPODetail))
  );

  // //Replace the dates in a way that can be read in SQL Server
  // deletedPODetails.forEach((detail) => {
  //   const { RefreshedTime, ERPProcessedTime, ECDBProcessedTime } = detail;
  //   detail.RefreshedTime = `CAST('${RefreshedTime}' as datetime)`;
  //   detail.ERPProcessedTime = `CAST('${ERPProcessedTime}' as datetime)`;
  //   detail.ECDBProcessedTime = `CAST('${ECDBProcessedTime}' as datetime)`;
  // });

  await insertAndDeleteDetails(deletedPODetails);
  // // await updateProductionImport(deletedPODetails);
};

module.exports = {
  getCurrentPODetailIds,
  getDeletedPODetails,
};
