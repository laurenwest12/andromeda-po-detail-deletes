const axios = require('axios');
const { url, idQuery } = require('./config.js');

const getCurrentPODetailIds = async () => {
  const { data } = await axios.post(`${url}/search/query/${idQuery}`);
  return data.map(({ id_productionorderdetail }) => id_productionorderdetail);
};

const getAndromedaData = async (query, start) => {
  try {
    let res;

    //Custom query example
    res = await axios.post(`${url}/search/query/${query}`, {
      getafterdate: start,
    });

    //Andromeda table example
    res = await axios.get(`${url}/bo/table`);

    const { data } = res;
  } catch (err) {
    return err;
  }
};

module.exports = {
  getCurrentPODetailIds,
};
