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

//Insert the po details that need to be deleted into a delete table in SQL Server and delete them from the archive table
const insertAndDeleteDetails = async (arr) => {
  const errors = [];

  //Insert all records into the delete table
  const submitErrors = await submitAllQueries(
    arr,
    'ProductionOrderDetailDeletes',
    true
  );

  submitErrors.length && errors.push(submitErrors);

  //Delete records from the archive
  for (let i = 0; i < arr.length; ++i) {
    const record = arr[i];
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

//Get the production order imports that need to have the id updated since it has since been deleted
const getProductionOrderImportsToUpdate = async (arr) => {
  //Put the ids into a WHERE clause format
  const deletedIdClause = arr.reduce((acc, value, index) => {
    const { idPODetail } = value;
    if (index === arr.length - 1) {
      acc += `'${idPODetail}')`;
    } else {
      acc += `'${idPODetail}',`;
    }
    return acc;
  }, `(`);

  const importsToUpdate = await getSQLServerData(
    '[Andromeda-UpTo].[dbo].[ProductionOrdersImport]',
    `WHERE idPODetail in ${deletedIdClause}`
  );

  return importsToUpdate;
};

const getNewIdPODetail = async (where) => {
  const row = await getSQLServerData(
    'ProductionOrderDetailImportArchive',
    where
  );
  return row[0]?.idPODetail || 0;
};

const updateImports = async (arr) => {
  const errors = [];
  for (let i = 0; i < arr.length; ++i) {
    const { idPO, Style, Color } = arr[i];
    const newId = await getNewIdPODetail(
      `WHERE
			idPO = '${idPO}'
			and Style = '${Style}'
			and Color = '${Color}'
			and MostRecent = 'Yes'`
    );
    try {
      await submitQuery(`UPDATE [Andromeda-UpTo].[dbo].[ProductionOrdersImport]
			SET idPODetail = '${newId}'
			WHERE idPO = '${idPO}'
			and Style = '${Style}'
			and Color = '${Color}'`);
    } catch (err) {
      errors.push({
        idPO,
        idPODetail: newId,
        style: Style,
        color: Color,
        err: err?.message,
      });
    }
  }
  return errors;
};

/*
1. Finds all of our current po details from ProductionOrderDetailImportArchive
2. Finds all po details that are in our db, but deleted from Andromda
3. Adds the deleted records to a delete table (ProductionOrderDetailDeletes) and deletes them from the archive
4. Updates the ProductionOrdersImport table with the correct detail PO if a record was deleted then added back
*/
const deletePODetails = async (ids) => {
  //Get all current id po details from our DB
  const sqlPODetails = await getSQLServerData(
    'ProductionOrderDetailImportArchive'
  );

  //Find id po details that are in our DB, but are deleted from Andromeda
  const deletedPODetails = sqlPODetails.filter(
    ({ idPODetail }) => !ids.includes(parseInt(idPODetail))
  );

  if (deletedPODetails.length) {
    // Insert po details into delete table and then delete from archive
    const insertAndDeleteErrors = await insertAndDeleteDetails(
      deletedPODetails
    );

    // Update the import table with the correct id
    const importsToUpdate = await getProductionOrderImportsToUpdate(
      deletedPODetails
    );
    const updateErrors = await updateImports(importsToUpdate);

    //Return any errors
    return [...insertAndDeleteErrors, ...updateErrors];
  }
  return [];
};

module.exports = {
  getCurrentPODetailIds,
  deletePODetails,
};
