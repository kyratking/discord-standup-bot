const { google, Auth } = require("googleapis");
const { format } = require("date-fns");
require("dotenv").config();

const sheetId = process.env.GOOGLE_SHEET_ID;

const gAuth = new Auth.GoogleAuth({
  keyFile: "./serviceAccount.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const service = google.sheets({ version: "v4", auth: gAuth });

const existsOrCreateSheet = async (user) => {
  try {
    const spreadsheet = await service.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    const {
      data: { sheets },
    } = spreadsheet;
    const filter = sheets.filter(({ properties }) => properties.title === user);
    if (filter.length === 0) {
      await service.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: user,
                },
              },
            },
          ],
        },
      });
      await service.spreadsheets.values.append({
        // Add the following headings in BOLD
        // Date, Content, Nonce
        spreadsheetId: sheetId,
        range: `${user}!A1`,
        requestBody: {
          values: [["Date", "Content", "Nonce", "Deleted"]],
        },
        valueInputOption: "USER_ENTERED",
      });
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const appendStandup = async (user, content, nonce, createdAt) => {
  try {
    await service.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${user}`,
      requestBody: {
        values: [
          [format(new Date(createdAt), "dd-MM-yyyy"), content, nonce, false],
        ],
      },
      valueInputOption: "USER_ENTERED",
    });
  } catch (error) {
    console.error(error);
    return false;
  }
};

const findRangeByNonce = async (user, nonce) => {
  try {
    const {
      data: { values },
    } = await service.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${user}!C:C`,
    });

    if (!values) {
      console.error(
        "Skipping marking deleted because values not found in query"
      );
      return false;
    }

    const range = values.findIndex((row) => row[0] === nonce);

    if (range === -1) {
      console.error("Skipping marking deleted because nonce not found");
      return false;
    }

    return range + 1;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const markDeleted = async (user, nonce) => {
  try {
    const range = await findRangeByNonce(user, nonce);
    if (!range) return;
    await service.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${user}!D${range}`,
      requestBody: {
        values: [[true]],
      },
      valueInputOption: "USER_ENTERED",
    });
  } catch (error) {
    console.error(error);
    return false;
  }
};

const updateContent = async (user, content, nonce) => {
  try {
    const range = await findRangeByNonce(user, nonce);
    if (!range) return;
    await service.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${user}!B${range}`,
      requestBody: {
        values: [[content]],
      },
      valueInputOption: "USER_ENTERED",
    });
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports = {
  existsOrCreateSheet,
  appendStandup,
  markDeleted,
  updateContent,
};
