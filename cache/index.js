const debug = require("debug")("cache");
const fs = require("fs");
const readline = require("readline");
const { OAuth2Client } = require("google-auth-library");
const { chain } = require("lodash");
const { google } = require("googleapis");

const { parseEvent } = require("../utils/parse");
const {
  CREDENTIALS_PATH,

  tokenPath,
  syncTokenPath,
  eventsPath,
  parsedEventsPath
} = require("../utils/paths");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.log(
    "No .credentials.json found, create one here: https://console.developers.google.com/"
  );

  process.exit(1);
}

// tokens

const storeToken = ({ calendar }, token) => {
  const fileName = tokenPath(calendar);

  fs.writeFileSync(fileName, JSON.stringify(token, null, 2));
  debug("Token stored in:", fileName);
};

const storeSyncToken = ({ calendar }, token) => {
  const fileName = syncTokenPath(calendar);

  const time = new Date().getTime();
  fs.writeFileSync(fileName, JSON.stringify({ token, time }, null, 2));
  debug("Sync token stored in:", fileName);
};

const getSyncToken = ({ calendar }) => {
  const fileName = syncTokenPath(calendar);

  if (fs.existsSync(fileName)) {
    return require(fileName).token;
  }

  return { token: null, time: null };
};

const getNewToken = ({ calendar }, oauth2Client, callback) => {
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

      storeToken({ calendar }, token);
      callback(null, oauth2Client);
    });
  });
};

// auth

const authorize = ({ calendar }, credentials, callback) => {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];

  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

  fs.readFile(tokenPath(calendar), (err, token) => {
    if (err) {
      getNewToken({ calendar }, oauth2Client, callback);
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

const getAllEvents = (
  { auth, calendarId, pageToken, syncToken, allEvents },
  callback
) => {
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

const storeEvents = ({ calendar }, events) => {
  const fileName = eventsPath(calendar);

  fs.writeFileSync(fileName, JSON.stringify(events, null, 2));
  debug("Events stored in:", fileName);
};

const storeParsedEvents = ({ calendar }, events) => {
  const fileName = parsedEventsPath(calendar);

  fs.writeFileSync(fileName, JSON.stringify(events, null, 2));
  debug("Parsed events stored in:", fileName);
};

const getStoredEvents = ({ calendar }) => {
  const fileName = eventsPath(calendar);

  if (fs.existsSync(fileName)) {
    return require(fileName);
  }

  return [];
};

// main

module.exports = options => {
  const credentials = require(CREDENTIALS_PATH);

  authorize({ calendar: options.calendar }, credentials, (err, auth) => {
    if (err) {
      console.log("Error:", err);
      process.exit(1);
    }

    getCalendars(auth, (err, res) => {
      if (err) {
        console.log("Error:", err);
        process.exit(1);
      }

      const calendar = res.data.items.find(
        ({ summary }) => summary === options.calendar
      );

      if (!calendar) {
        console.log("Error: no matching calendar found");
        process.exit(1);
      }

      getAllEvents(
        {
          auth,
          calendarId: calendar.id,
          syncToken: getSyncToken({ calendar: options.calendar })
        },
        (err, { events, syncToken }) => {
          if (err) {
            console.log("Error:", err);
            process.exit(1);
          }

          const prevEvents = getStoredEvents({ calendar: options.calendar });
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

            const parsedEvents = chain(finalEvents)
              .map(parseEvent)
              .sortBy(e => e.start)
              .value();

            storeEvents({ calendar: options.calendar }, finalEvents);
            storeParsedEvents({ calendar: options.calendar }, parsedEvents);
          }

          storeSyncToken({ calendar: options.calendar }, syncToken);
        }
      );
    });
  });
};
