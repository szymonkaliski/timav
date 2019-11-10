import fs from "fs";
import moment from "moment-timezone";
import { google } from "googleapis";
import { isArray } from "lodash";

import getAuth from "./get-auth";

const DATA_CACHE_PATH = `${__dirname}/../data_timav/data.json`;
const TOKEN_CACHE_PATH = `${__dirname}/../data_timav/token.json`;

const FULL_DAY_EVENT_DATE_LENGTH = "yyyy-mm-dd".length;

const flatten = xs => xs.reduce((acc, x) => acc.concat(isArray(x) ? x : [x]), []);

const getEvents = ({ auth, calendarId, callback, pageToken, syncToken }) => {
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

const getAllEvents = ({ auth, calendarId, callback, pageToken, syncToken, allEvents }) => {
  allEvents = allEvents || [];

  getEvents({
    auth,
    calendarId,
    pageToken,
    syncToken,
    callback: (err, response) => {
      if (err) {
        console.error(err);
        return;
      }

      const nextAllEvents = allEvents.concat(response.data.items);

      if (!response.data.nextPageToken) {
        return callback(null, {
          events: nextAllEvents,
          syncToken: response.data.nextSyncToken
        });
      }

      getAllEvents({
        auth,
        calendarId,
        callback,
        pageToken: response.data.nextPageToken,
        syncToken,
        allEvents: nextAllEvents
      });
    }
  });
};

const parseProject = title => {
  const project = title.split("@")[0].trim();
  const tags = flatten(
    title
      .split("@")
      .slice(1)
      .map(tag => {
        if (tag.indexOf("(") >= 0) {
          const tagName = tag.match(/(.+)\(/)[1];
          const subTags = tag.match(/\((.+)(,|\))/)[1];

          return subTags.split(",").map(subTag => ({ tag: tagName, subTag }));
        } else {
          return { tag: tag.trim() };
        }
      })
  );

  return { project, tags };
};

const parseToTimezoneIndependentDate = args => {
  if (args.date) {
    return new Date(args.date);
  }

  return new Date(args.dateTime);
};

const parseWithTimezone = (dateStr, zone) => {
  const parsedStr = zone
    ? moment.tz(dateStr, zone).format("YYYY-MM-DDTHH:mm:ss")
    : moment(dateStr).format("YYYY-MM-DDTHH:mm:ss");

  return `${parsedStr}:00.000Z`;
};

const parseEvent = event => {
  // full-day events become markers
  const isMarker =
    event.start.date &&
    event.end.date &&
    event.start.date.length === FULL_DAY_EVENT_DATE_LENGTH &&
    event.end.date.length === FULL_DAY_EVENT_DATE_LENGTH;

  const start = parseToTimezoneIndependentDate(event.start);
  const end = parseToTimezoneIndependentDate(event.end);

  const orgStart = event.start;
  const orgEnd = event.end;

  const startDateStr = parseWithTimezone(orgStart.dateTime || orgStart.date, orgStart.timeZone);

  const endDateStr = parseWithTimezone(orgEnd.dateTime || orgEnd.date, orgEnd.timeZone);

  const duration = !isMarker ? end - start : 0;
  const id = event.id;
  const note = event.description;

  const { project, tags } = parseProject(event.summary);

  const summary = `${project} ${tags
    .map(({ tag, subTag }) => (subTag ? `@${tag}(${subTag})` : `@${tag}`))
    .sort()
    .join(" ")}`;

  return {
    id,

    summary,
    project,
    tags,
    note,
    duration,
    isMarker,

    start,
    end,

    startDateStr,
    endDateStr,

    orgStart,
    orgEnd
  };
};

const parseEvents = events => ({
  upserted: events
    .filter(({ status, summary }) => status === "confirmed" && !!summary)
    .reduce((acc, event) => {
      const parsed = parseEvent(event);
      acc[parsed.id] = parsed;
      return acc;
    }, {}),

  removed: events.filter(({ status }) => status === "cancelled").map(({ id }) => id)
});

export const fetch = callback => {
  console.time("timav");
  const cachedEvents = require(DATA_CACHE_PATH).events || {};
  const cachedSyncTime = require(DATA_CACHE_PATH).syncTime || {};
  const cachedSyncToken = require(TOKEN_CACHE_PATH).syncToken;

  getAuth((err, result) => {
    if (err) {
      const processedEvents = Object.keys(cachedEvents).reduce((memo, id) => {
        const cachedEvent = cachedEvents[id];
        return Object.assign(memo, { [id]: cachedEvent });
      }, {});

      return callback(err, {
        events: processedEvents,
        syncTime: cachedSyncTime
      });
    }

    const { auth, calendar } = result;

    getAllEvents({
      calendarId: calendar.id,
      auth,
      syncToken: cachedSyncToken,
      callback: (err, { events, syncToken }) => {
        if (err) {
          console.timeEnd("timav");
          callback(err);
        }

        const parsed = parseEvents(events);

        const finalEvents = Object.assign(
          {},
          Object.keys(cachedEvents).reduce((memo, id) => {
            const cachedEvent = cachedEvents[id];

            if (!!parsed.removed.find(removedEventId => removedEventId === id)) {
              return memo;
            }

            return Object.assign(memo, { [id]: cachedEvent });
          }, {}),
          parsed.upserted
        );

        const syncTime = new Date().getTime();

        fs.writeFile(DATA_CACHE_PATH, JSON.stringify({ events: finalEvents, syncTime }, null, 2), () => {
          fs.writeFile(TOKEN_CACHE_PATH, JSON.stringify({ syncToken }, null, 2), () => {
            console.timeEnd("timav");
            callback(null, { parsed, events: finalEvents, syncTime });
          });
        });
      }
    });
  });
};

export const get = () => require(DATA_CACHE_PATH).events || {};

export const getSyncTime = () => require(DATA_CACHE_PATH).syncTime;
