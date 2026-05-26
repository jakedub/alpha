from app.models.event import Event
from app.models.user_event import UserEvent


def sync_user_events(user, schedule_payload: dict):
    items = schedule_payload.get("data", [])

    synced = []
    unmatched = []

    for item in items:
        event_id = str(item["event_id"])

        try:
            event = Event.objects.get(game_id__endswith=event_id)
        except Event.DoesNotExist:
            unmatched.append(event_id)
            continue

        UserEvent.objects.update_or_create(
            user=user,
            event=event,
            defaults={
                'status': 'purchased',
                'self_assigned': False,
            }
        )
        synced.append(event_id)

    return {
        'synced': len(synced),
        'unmatched': unmatched,
    }