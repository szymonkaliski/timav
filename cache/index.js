const debug = require("debug")("cache");
const fs = require("fs");
const readline = require("readline");
const { OAuth2Client } = require("google-auth-library");
const { chain } = require("lodash");
const { google } = require("googleapis");

const { parseEvent } = require("../utils/parse");
const { CREDENTIALS_PATH, TOKEN_PATH, SYNC_TOKEN_PATH, EVENTS_PATH, PARSED_EVENTS_PATH } = require("../utils/paths");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.log("No .credentials.json found, create one here: https://console.developers.google.com/");

  process.exit(1);
}

// tokens

const storeToken = token => {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
  debug("Token stored in:", TOKEN_PATH);
};

const storeSyncToken = token => {
  const time = new Date().getTime();
  fs.writeFileSync(SYNC_TOKEN_PATH, JSON.stringify({ token, time }, null, 2));
  debug("Sync token stored in:", SYNC_TOKEN_PATH);
};

const getSyncToken = () => {
  if (fs.existsSync(SYNC_TOKEN_PATH)) {
    return require(SYNC_TOKEN_PATH).token;
  }

  return { token: null, time: null };
};

const getNewToken = (oauth2Client, callback) => {
  const authUrl = oauth2Client.generateAuthUrl({
    ["access_type"]: "offline",
    scope: SCOPES
  });

  debug("Authorize this app by visiting this url:", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Enter the code from that page here:", code => {
    rl.close();

    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        debug("Error while trying to retrieve access token:", err);
        return;
      }

      oauth2Client.credentials = token;

      storeToken(token);
      callback(null, oauth2Client);
    });
  });
};

// auth

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
      callback(null, oauth2Client);
    }
  });
};

// calendar

const getCalendars = (auth, callback) => {
  const calendar = google.calendar("v3");
  calendar.calendarList.list({ auth }, callback);
};

// events

const getEvents = ({ auth, calendarId, pageToken, syncToken }, callback) => {
  const calendar = google.calendar("v3");

  const config = {
    calendarId,
    auth,
    maxResults: 100,
    singleEvents: true
  };

  if (pageToken) {
    config.pageToken = pageToken;
  }

  if (syncToken) {
    config.syncToken = syncToken;
  }

  calendar.events.list(config, callback);
};

const getAllEvents = ({ auth, calendarId, pageToken, syncToken, allEvents }, callback) => {
  allEvents = allEvents || [];

  debug("Downloading page:", { pageToken, syncToken });

  getEvents({ auth, calendarId, pageToken, syncToken }, (err, response) => {
    if (err) {
      console.log("Error:", err);
      return;
    }

    const nextAllEvents = allEvents.concat(response.data.items);

    if (!response.data.nextPageToken) {
      return callback(null, {
        events: nextAllEvents,
        syncToken: response.data.nextSyncToken
      });
    }

    getAllEvents(
      {
        auth,
        calendarId,
        pageToken: response.data.nextPageToken,
        syncToken,
        allEvents: nextAllEvents
      },
      callback
    );
  });
};

const storeEvents = events => {
  fs.writeFileSync(EVENTS_PATH, JSON.stringify(events, null, 2));
  debug("Events stored in:", EVENTS_PATH);
};

const storeParsedEvents = events => {
  fs.writeFileSync(PARSED_EVENTS_PATH, JSON.stringify(events, null, 2));
  debug("Parsed events stored in:", PARSED_EVENTS_PATH);
};

const getStoredEvents = () => {
  if (fs.existsSync(EVENTS_PATH)) {
    return require(EVENTS_PATH);
  }

  return [];
};

// main

module.exports = options => {
  const credentials = require(CREDENTIALS_PATH);

  authorize(credentials, (err, auth) => {
    if (err) {
      console.log("Error:", err);
      process.exit(1);
    }

    getCalendars(auth, (err, res) => {
      if (err) {
        console.log("Error:", err);
        process.exit(1);
      }

      const calendar = res.data.items.find(({ summary }) => summary === options.calendar);

      if (!calendar) {
        console.log("Error: no matching calendar found");
        process.exit(1);
      }

      getAllEvents(
        {
          auth,
          calendarId: calendar.id,
          syncToken: getSyncToken()
        },
        (err, { events, syncToken }) => {
          if (err) {
            console.log("Error:", err);
            process.exit(1);
          }

          const prevEvents = getStoredEvents();
          let finalEvents;

          if (events.length === 0) {
            debug("No changes");

            finalEvents = prevEvents;
          } else {
            debug("API events\n", events);

            finalEvents = chain(prevEvents)
              .map(e => {
                const matchingEvent = events.find(e2 => e2.id === e.id);

                if (matchingEvent) {
                  debug("Updated event\n", matchingEvent);
                  return matchingEvent;
                }

                return e;
              })
              .concat(
                events.filter(e => {
                  // new
                  const matchingEvent = prevEvents.find(e2 => e2.id === e.id);

                  if (!matchingEvent) {
                    debug("New event\n", e);
                  }

                  return !matchingEvent;
                })
              )
              .filter(e => e.status !== "cancelled")
              .value();

            storeEvents(finalEvents);

            storeParsedEvents(finalEvents.map(parseEvent));
          }

          storeSyncToken(syncToken);
        }
      );
    });
  });
};
