const { google, Auth } = require("googleapis");
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
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

existsOrCreateSheet();
