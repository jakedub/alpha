from playwright.sync_api import sync_playwright


class GenConAuth:
    BASE = "https://www.gencon.com"

    def __init__(self, headless=True):
        self.headless = headless

    def get_cookie_header(self, email: str, password: str) -> str:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.headless)
            context = browser.new_context()
            page = context.new_page()

            page.goto(f"{self.BASE}/users/sign_in", wait_until="domcontentloaded")

            page.fill("#user_email", email)
            page.fill("#user_password", password)
            page.click('input[type="submit"]')

            page.wait_for_timeout(3000)

            if "sign_in" in page.url:
                browser.close()
                raise Exception("Login failed")

            cookies = context.cookies()
            browser.close()

        return "; ".join(f"{c['name']}={c['value']}" for c in cookies)