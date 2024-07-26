const Gate = require("./gate");
const { API_BASE, EMAIL, PASSWORD, DEVICE_NAME } = process.env;

class Api {
  static token;

  static async login() {
    const payload = {
      email: EMAIL,
      password: PASSWORD,
      device_name: DEVICE_NAME,
    };

    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const data = await res.json();
    if (res.statusText !== "OK") throw new Error(data.message);
    return data.token;
  }

  static async getSetting() {
    const res = await fetch(`${API_BASE}/setting`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    });

    const data = await res.json();
    if (res.statusText !== "OK") throw new Error(data.message);
    return data;
  }

  // return gate based on host ip address
  static async getGate() {
    const res = await fetch(`${API_BASE}/gateIn/me`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      params: { status: true },
    });
    const data = await res.json();
    if (res.statusText !== "OK") throw new Error(data.message);

    const {
      id,
      nama,
      jenis_kendaraan,
      controller_ip_address: ipAddress,
      controller_port: baudrate,
      printer,
    } = data;

    const gate = new Gate(
      id,
      nama,
      ipAddress,
      jenis_kendaraan,
      baudrate,
      printer
    );
    return gate;
  }
}

module.exports = Api;
