const { exec } = require("child_process");
const axios = require("axios");
require('dotenv').config();
const cron = require('node-cron');

const BASE_ADDRESS = "192.168.0";
const COMPUTERS = [
  {
    port: 4363,
    name: "Tayyaba:  ",
  },
  {
    port: 4365,
    name: "Zeeshan:",
  },
  {
    port: 4366,
    name: "Iqra:        ",
  },
  {
    port: 4367,
    name: "Faizan:   ",
  },
];
const checkIP = async (cmd) => {
  return new Promise((resolve) => {
    exec(
      cmd,
      {
        timeout: 100,
      },
      (err, stdout, stderr) => {
        if (stdout.includes("Connected")) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    );
  });
};
const getIp = async () => {
  const range = 1;
  for (let i = range; i <= 255; i++) {
    if(i % 100 == 0) console.log('Range completed ' + i/255 * 100 + '%')
    const address = `${BASE_ADDRESS}.${i}`;
    for (let computer of COMPUTERS) {
      if (computer.ip) {
        continue;
      }
      let f = await checkIP(`telnet ${address} ${computer.port}`);
      if (f) {
        computer.ip = address;
      }
    }
  }
  await saveMessage(formatMessage(COMPUTERS))
};
const formatMessage = (comp) => {
    let message = ``;
    for(let c of comp){
        message += `${c.name}      ${c.ip}:${c.port}\n`;
    }
    message += `\n## ${new Date().toLocaleString()}`
    return message;
}
const saveMessage = (message) => {
  let data = JSON.stringify({
    content: message,
  });

  let config = {
    method: "patch",
    maxBodyLength: Infinity,
    url: "https://discord.com/api/v10/channels/1197488531598233650/messages/1197512544391278663",
    headers: {
      Accept: "application/json",
      Authorization:
        `Bot ${process.env.DISCORD_TOKEN}`,
        "Content-Type": "application/json",
    },
    data: data,
  };

  return axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
};

//run every hour
cron.schedule('0 * * * *', () => {
  getIp();
})