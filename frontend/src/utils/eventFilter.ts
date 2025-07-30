// eventFilter.ts
// If 'title' should exist on Event, update the type definition as follows:

type Event = {
  title: string;
  game_id: string;
  // ...other properties
};

export const eventFilter = (events: Event[], query: string): Event[] => {
  return events.filter((event) =>
    event.title.toLowerCase().includes(query.toLowerCase()) ||
    event.game_id.toLowerCase().includes(query.toLowerCase())
  );
};