from playwright.sync_api import sync_playwright
import requests


class GenConPlaywrightClient:
    BASE = "https://www.gencon.com"

    def __init__(self, headless=True):
        self.headless = headless

    # -------------------------
    # LOGIN (Playwright only)
    # -------------------------
    def login_and_get_cookies(self, email: str, password: str):
        p = sync_playwright().start()
        browser = p.chromium.launch(headless=self.headless)
        context = browser.new_context()
        page = context.new_page()

        page.goto(f"{self.BASE}/users/sign_in", wait_until="domcontentloaded")

        page.fill("#user_email", email)
        page.fill("#user_password", password)
        page.click('input[type="submit"]')

        page.wait_for_timeout(4000)

        if "sign_in" in page.url:
            browser.close()
            p.stop()
            raise Exception("Login failed - still on sign in page")

        # extract cookies
        cookies = context.cookies()
        browser.close()
        p.stop()

        # convert to requests cookie header
        cookie_header = "; ".join([f"{c['name']}={c['value']}" for c in cookies])

        return cookie_header

    # -------------------------
    # FETCH SCHEDULE (requests)
    # -------------------------
    def get_schedule(self, gencon_id: str, cookie_header: str):
        url = f"{self.BASE}/api/v2/schedule"

        resp = requests.get(
            url,
            params={
                "contact_id": gencon_id,
                "page": 1
            },
            headers={
                "accept": "application/json, text/plain, */*",
                "referer": f"{self.BASE}/schedules/{gencon_id}",
                "user-agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                "cookie": cookie_header,
                "x-requested-with": "XMLHttpRequest",
            },
        )

        if resp.status_code != 200:
            raise Exception(f"Schedule fetch failed: {resp.status_code} - {resp.text}")

        return resp.json()


# -------------------------
# PUBLIC FUNCTION
# -------------------------
def fetch_user_schedule(gencon_id: str):
    client = GenConPlaywrightClient(headless=True)

    cookie_header = client.login_and_get_cookies(
        email=os.environ.get("GENCON_EMAIL"),
        password=os.environ.get("GENCON_PASSWORD")
    )

    return client.get_schedule(gencon_id, cookie_header)