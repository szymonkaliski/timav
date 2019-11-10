import fs from "fs";
import path from "path";
import readline from "readline";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const TOKEN_PATH = path.join(__dirname, "/.credentials.json");

const CALENDAR_NAME = "Tracking";

const storeToken = token => {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  console.log("Token stored to " + TOKEN_PATH);
};

const getNewToken = (oauth2Client, callback) => {
  const authUrl = oauth2Client.generateAuthUrl({
    ["access_type"]: "offline",
    scope: SCOPES
  });

  console.log("Authorize this app by visiting this url: ", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Enter the code from that page here: ", code => {
    rl.close();

    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
};

const authorize = (credentials, callback) => {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
};

const getCalendars = ({ auth, callback }) => {
  const calendar = google.calendar("v3");

  const config = { auth };

  calendar.calendarList.list(config, callback);
};

const chooseCalendar = ({ auth, callback }) => {
  getCalendars({
    auth,
    callback: (err, list) => {
      if (err || !list) {
        callback(err);
      } else {
        callback(null, list.data.items.find(item => item.summary === CALENDAR_NAME));
      }
    }
  });
};

export default callback => {
  fs.readFile(path.join(__dirname, "/.client_secret.json"), (err, content) => {
    if (err) {
      console.log("Error loading client secret file: " + err);
      return;
    }

    authorize(JSON.parse(content), auth => {
      chooseCalendar({
        auth,
        callback: (err, calendar) => {
          callback(err, { auth, calendar });
        }
      });
    });
  });
};

process.on("unhandledRejection", error => console.error(error.stack));
