const axios = require('axios');
const { url } = require('./config.js');

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
  getAndromedaData,
};
