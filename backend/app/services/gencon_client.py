import requests


class GenConClient:
    BASE_URL = "https://www.gencon.com"

    def __init__(self, cookies=None):
        self.session = requests.Session()

        self.session.headers.update({
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
        })

        if cookies:
            for c in cookies:
                self.session.cookies.set(
                    c["name"],
                    c["value"],
                    domain=c.get("domain"),
                    path=c.get("path"),
                )

    def get_schedule(self, schedule_id: str):
        url = f"{self.BASE_URL}/schedules/{schedule_id}.json"

        resp = self.session.get(url)

        if resp.status_code != 200:
            raise Exception(f"{resp.status_code}: {resp.text}")

        return resp.json()