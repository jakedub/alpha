def calculate_adjusted_buffer(current: 'Event', next_event: 'Event', context: dict) -> int:
    buffer = 0
    buffer += get_elevator_buffer(context.get("time_of_day", "12:00"))
    buffer += get_crowd_buffer(next_event.location.name if hasattr(next_event, "location") else "")
    buffer += get_transition_buffer(context.get("consecutive_events", 1))
    buffer += get_fatigue_buffer(context.get("consecutive_events", 1))
    buffer += get_mobility_buffer(context.get("mobility", "none"))
    buffer += get_weather_buffer(context.get("weather", "clear"), context.get("time_of_day", "12:00"))
    return buffer

def get_mobility_buffer(mobility: str) -> int:
    if mobility == 'wheelchair':
        return 60
    elif mobility in ('cane', 'walker'):
        return 30
    return 0

def get_weather_buffer(weather: str, time_of_day: str) -> int:
    hour = int(time_of_day.split(":")[0])
    if 9 <= hour <= 17:
        if weather == 'rain':
            return 30  # slower indoors
        elif weather == 'hot':
            return 20  # slower movement generally
    return 0
from typing import List
from app.models.event import Event

def detect_event_conflicts(events: List[Event]) -> List[tuple]:
    """Detects conflicts between overlapping events.

    Args:
        events (List[Event]): A list of event objects with start_time and end_time.

    Returns:
        List[tuple]: A list of tuples (event1, event2) that conflict.
    """
    conflicts = []
    sorted_events = sorted(events, key=lambda e: e.start_time)

    for i in range(len(sorted_events)):
        for j in range(i + 1, len(sorted_events)):
            first = sorted_events[i]
            second = sorted_events[j]
            if second.start_time < first.end_time:
                conflicts.append((first, second))
            else:
                break  # No further conflicts for this event

    return conflicts

def get_elevator_buffer(time_of_day: str) -> int:
    if time_of_day in ["09:00", "13:00", "17:00"]:
        return 60
    return 30

def get_crowd_buffer(building_name: str) -> int:
    return 90 if building_name in {"Exhibit Hall", "Westin Ballroom"} else 30

def get_transition_buffer(consecutive_events: int) -> int:
    return 60 if consecutive_events >= 3 else 0

def get_fatigue_buffer(consecutive_events) -> int:
    return 30 if consecutive_events >= 3 else 0

def evaluate_travel_warnings(events: List[Event]) -> List[str]:

    warnings = []
    sorted_events = sorted(events, key=lambda e: e.start_time)

    for i in range(len(sorted_events) - 1):
        current = sorted_events[i]
        next_event = sorted_events[i + 1]

        context = {
            "time_of_day": current.start_time.strftime("%H:%M"),
            "consecutive_events": i + 1,
        }

        required_buffer = calculate_adjusted_buffer(current, next_event, context)
        actual_buffer = (next_event.start_time - current.end_time).total_seconds() / 60

        if current.venue_id != next_event.venue_id and actual_buffer < required_buffer:
            warnings.append(
                f"Only {int(actual_buffer)} min between '{current.title}' and '{next_event.title}' in different venues — expected at least {required_buffer} min."
            )

        # Check if floor level changes (optional)
        if hasattr(current.room, 'floor') and hasattr(next_event.room, 'floor'):
            if current.room.floor is not None and next_event.room.floor is not None:
                floor_diff = abs(current.room.floor - next_event.room.floor)
                if floor_diff >= 2 and actual_buffer < 10:
                    warnings.append(
                        f"Steep floor transition ({floor_diff} floors) between '{current.title}' and '{next_event.title}' with only {int(actual_buffer)} min."
                    )

    return warnings