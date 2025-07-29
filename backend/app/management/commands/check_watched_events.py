from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from app.models import UserWatchedEvent

class Command(BaseCommand):
    help = 'Checks watched events and sends email if tickets become available.'

    def handle(self, *args, **kwargs):
        watched_events = UserWatchedEvent.objects.select_related('user', 'event')

        notified = 0
        updated = 0

        for watch in watched_events:
            event = watch.event
            if not event:
                continue

            tickets_available = event.tickets_available > 0
            if tickets_available != watch.last_known_status:
                watch.last_known_status = tickets_available
                watch.save(update_fields=['last_known_status', 'last_checked'])
                updated += 1

                if tickets_available:
                    send_mail(
                        subject='🎟 Tickets Available for {}'.format(event.title),
                        message=(
                            f"Hi {watch.user.first_name},\n\n"
                            f"Good news! Tickets are now available for the event:\n\n"
                            f"{event.title}\n\n"
                            f"Location: {event.location.name if event.location else 'Unknown'}\n"
                            f"Time: {event.start_time.strftime('%A %I:%M %p')}\n\n"
                            f"Go grab yours before they’re gone!"
                        ),
                        from_email='noreply@yourapp.com',
                        recipient_list=[watch.user.email],
                        fail_silently=False,
                    )
                    notified += 1

        self.stdout.write(self.style.SUCCESS(f"Updated {updated} watched events. Sent {notified} emails."))