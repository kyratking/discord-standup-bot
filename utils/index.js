const axios = require("axios");

const greet = () => console.log("Successfully connected to Discord");

const sendError = (title, error) => {
  const axiosConfig = {
    method: "post",
    maxBodyLength: Infinity,
    url: process.env.REPORTING_WEBHOOK || "",
    data: {
      content: null,
      embeds: [
        {
          title,
          description:
            "Something went wrong. Please check the logs for more information.",
          color: 16515072,
          fields: [
            {
              name: "Error",
              value:
                "```" +
                JSON.stringify(error, Object.getOwnPropertyNames(error)) +
                "```",
            },
          ],
        },
      ],
      attachments: [],
    },
  };
  try {
    axios(axiosConfig);
  } catch (error) {
    console.error(`Error sending error to Discord: ${error}`);
  }
};

module.exports = { greet, sendError };
