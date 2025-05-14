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
    """
    Evaluate travel-related warnings between consecutive events.

    Args:
        events (List[Event]): A list of event objects sorted by start_time.

    Returns:
        List[str]: A list of travel warning messages between events.
    """
    warnings = []
    sorted_events = sorted(events, key=lambda e: e.start_time)

    for i in range(len(sorted_events) - 1):
        current = sorted_events[i]
        next_event = sorted_events[i + 1]

        # Check time between events
        time_gap = (next_event.start_time - current.end_time).total_seconds() / 60

        if current.venue_id != next_event.venue_id:
            if time_gap < 15:
                warnings.append(
                    f"Insufficient travel time ({int(time_gap)} min) between '{current.title}' and '{next_event.title}' in different venues."
                )

        # Check if floor level changes (optional)
        if hasattr(current.room, 'floor') and hasattr(next_event.room, 'floor'):
            if current.room.floor is not None and next_event.room.floor is not None:
                floor_diff = abs(current.room.floor - next_event.room.floor)
                if floor_diff >= 2 and time_gap < 10:
                    warnings.append(
                        f"Steep floor transition ({floor_diff} floors) between '{current.title}' and '{next_event.title}' with only {int(time_gap)} min."
                    )

    return warnings