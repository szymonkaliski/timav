const { first, startCase, isArray } = require("lodash");

const { parseProject } = require("./parse");

const stringifyFiltering = filtering => {
  if (isArray(filtering)) {
    const [logic, filter] = filtering;

    if (logic === "and") {
      return filter.map(stringifyFiltering).join(" ∧ ");
    }

    if (logic === "or") {
      return filter.map(stringifyFiltering).join(" ∨ ");
    }
  } else {
    return startCase(
      filtering
        .replace(/^@/, "")
        .replace(/\(/, " ")
        .replace(/\)/, " ")
    );
  }
};

const filterEvent = (event, filtering) => {
  // ugly reuse of project parsing to get tags out...
  const { tag, subTag } = first(parseProject(filtering).tags);

  return event.tags.find(({ tag: eventTag, subTag: eventSubTag }) => {
    if (tag && subTag) {
      return eventTag === tag && eventSubTag === subTag;
    }

    if (tag && !subTag) {
      return eventTag === tag;
    }

    if (!tag && subTag) {
      return eventSubTag === subTag;
    }

    return false;
  });
};

const filterEvents = (events, filtering) => {
  if (isArray(filtering)) {
    console.error("array-based filtering is not supported (yet)");

    // const [logic, filter] = filtering;

    // // filter each of the children recursively
    // const filtered = filter.map(f => filterEvents(events, f));

    // if (logic === "and") {
    //   // wa want only events with keys that are in each filter
    //   return Object.keys(events)
    //     .filter(key => filtered.every(filteredEvents => Object.keys(filteredEvents).indexOf(key) >= 0))
    //     .reduce((memo, key) => Object.assign(memo, { [key]: events[key] }), {});
    // }

    // if (logic === "or") {
    //   // just merge all the filtered events
    //   return filtered.reduce((memo, events) => Object.assign(memo, events), {});
    // }
  } else {
    // if filtering is not an array, it means it's stringified tag + subtag
    return events.filter(event => filterEvent(event, filtering));
  }
};

module.exports = { filterEvents, stringifyFiltering };
