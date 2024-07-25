require("dotenv").config();
const { Api } = require("./models");

const app = async () => {
  try {
    Api.TOKEN = await Api.login();
    Api.SETTING = await Api.getSetting();
    const gate = await Api.getGate();
    gate.scan();
  } catch (error) {
    console.error(error.message);
    console.error(error.fileName, "line", error.lineNumber);
  }
};

app();
