const axios = require('axios');
const CryptoJS = require('crypto-js');
const { url, user, applicationKey } = require('./config.js');

const guid = () => {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    s4() +
    s4()
  );
};

const getHash = (key) => {
  const token = guid();
  const sig = CryptoJS.HmacSHA256(token, key).toString(CryptoJS.enc.Hex);
  return { token, sig };
};

const reqSession = async (token, signature) => {
  const res = await axios.post(`${url}/auth/requestsession`, {
    Token: token,
    Signature: signature,
    User: user,
    App: 'API',
    Device: 'API',
  });
  return res.data;
};

const andromedaAuthorization = async () => {
  //Create a HMAC SHA256 hash value based on the registered application key (found in the config file).
  const hash = getHash(applicationKey);
  const { token, sig } = hash;

  /*
	Andromeda requires a session ID to be passed as authorization for each API call.
	A session ID is requested via the API based on the application key and the has value computed above.
	Each session only lasts a finite amount of time, so we request a new session each time the application runs.
	*/
  let SessionID;

  let res = await reqSession(token, sig);

  if (res.SessionID) {
    SessionID = res.SessionID;
  } else {
    throw {
      message: 'Andromeda Authorization Error',
    };
  }

  //Set the retrieved Session ID for all axios calls.
  axios.defaults.headers.common['Authorization'] = `Bearer ${SessionID}`;
};

module.exports = { andromedaAuthorization };
