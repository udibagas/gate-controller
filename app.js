require("dotenv").config();
const { Api } = require("./models");

const app = async () => {
  try {
    await Api.login();
    await Api.getSetting();
    const gate = await Api.getGate();
    gate.scan();
  } catch (error) {
    console.error(error.message);
  }
};

app();
