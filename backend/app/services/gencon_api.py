import requests


class GenConAPI:
    BASE = "https://www.gencon.com"

    def __init__(self, cookie_header: str):
        self.session = requests.Session()

        self.session.headers.update({
            "accept": "application/json, text/plain, */*",
            "user-agent": "Mozilla/5.0",
            "x-requested-with": "XMLHttpRequest",
        })

        self.session.headers["cookie"] = cookie_header

    def get_schedule(self, contact_id: str):
        url = f"{self.BASE}/api/v2/schedule"

        resp = self.session.get(url, params={
            "contact_id": contact_id,
            "page": 1
        })

        if resp.status_code != 200:
            raise Exception(f"Schedule fetch failed: {resp.status_code} - {resp.text}")

        return resp.json()