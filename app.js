require("dotenv").config();
const { Api } = require("./models");

const app = async () => {
  try {
    Api.TOKEN = await Api.login();
    console.log(`Login success! TOKEN =`, Api.TOKEN);
    Api.SETTING = await Api.getSetting();
    const gate = await Api.getGate();
    console.log("Gate", gate);
    gate.token = Api.TOKEN;
    gate.scan();
  } catch (error) {
    console.error(error);
  }
};

app();
