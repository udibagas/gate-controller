require("dotenv").config();
const { Api } = require("./models");

const app = async () => {
  try {
    Api.token = await Api.login();
    console.log(`Login success! TOKEN =`, Api.token);
    const gate = await Api.getGate();
    gate.token = Api.token;
    gate.setting = await Api.getSetting();
    console.log("Gate =", gate);
    gate.scan();
  } catch (error) {
    console.error(error);
  }
};

app();
