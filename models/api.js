const Gate = require("./gate");
const { API_BASE, EMAIL, PASSWORD, DEVICE_NAME } = process.env;

class Api {
  static TOKEN;
  static SETTING;

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
        Authorization: `Bearer ${this.TOKEN}`,
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
        Authorization: `Bearer ${this.TOKEN}`,
      },
      params: { status: true },
    });
    const data = await res.json();
    if (res.statusText !== "OK") throw new Error(data.message);

    const {
      id,
      nama,
      jenis_kendaraan,
      controller_ip_address: path,
      controller_port: baudrate,
      printer,
    } = data;

    return new Gate(id, nama, jenis_kendaraan, path, baudrate, printer);
  }

  static async saveDataAndOpenGate(gate) {
    const { nama, jenis_kendaraan, id } = gate;
    const payload = { is_member: 0, jenis_kendaraan, gate_in_id: id };
    const res = await fetch(`${API_BASE}/apiStore`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.TOKEN}`,
      },
    });

    const json = await res.json();
    if (res.statusText != "OK") throw new Error(json.message);
    console.log(`${nama}: ${JSON.stringify(json)}`);
    gate.printer.printTicket(json, gate, this.SETTING);
    gate.open(3);
  }
}

module.exports = Api;
