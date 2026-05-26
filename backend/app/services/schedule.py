import os
from app.services.gencon_auth import GenConAuth
from app.services.gencon_api import GenConAPI
from app.services.user_events_sync import sync_user_events
from django.contrib.auth import get_user_model

User = get_user_model()


def fetch_user_schedule(user_id: int):
    user = User.objects.get(id=user_id)

    if not user.gencon_id:
        raise Exception(f"User {user_id} has no gencon_id set")

    email = os.environ.get("GENCON_EMAIL")
    password = os.environ.get("GENCON_PASSWORD")

    if not email or not password:
        raise Exception("GENCON_EMAIL and GENCON_PASSWORD must be set in environment")

    auth = GenConAuth(headless=True)
    cookie_header = auth.get_cookie_header(email=email, password=password)

    api = GenConAPI(cookie_header)
    data = api.get_schedule(user.gencon_id)

    report = sync_user_events(user, data)
    return report