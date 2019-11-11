const moment = require("moment-timezone");
const { chain } = require("lodash");

const FULL_DAY_EVENT_DATE_LENGTH = "yyyy-mm-dd".length;

const parseProject = title => {
  const project = title.split("@")[0].trim();
  const tags = chain(title)
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
    .flatten()
    .value();

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

module.exports = { parseEvent };
