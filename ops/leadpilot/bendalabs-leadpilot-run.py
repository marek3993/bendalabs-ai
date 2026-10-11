#!/usr/bin/python3
"""One authenticated callback, without retries or credentials in arguments/logs."""
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ENDPOINT = "https://bendalabs.sk/api/cron/leadpilot"
SECRET_FILE = Path("/etc/bendalabs-leadpilot/cron.secret")
PUBLIC_FIELDS = ("run_key", "status", "found", "saved", "skipped", "reused", "error_count", "reason")


def main():
    try:
        secret = SECRET_FILE.read_text().strip()
        if not secret:
            raise ValueError("missing configuration")
        request = urllib.request.Request(ENDPOINT, headers={
            "Authorization": "Bearer " + secret,
            "User-Agent": "BendaLabsScheduler/1.0",
            "Accept": "application/json",
        })
        # No redirects: authorization must stay on the configured HTTPS endpoint.
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, headers, newurl):
                return None

        with urllib.request.build_opener(NoRedirect()).open(request, timeout=320) as response:
            result = json.loads(response.read(16384))
            if not isinstance(result, dict):
                raise ValueError("invalid response")
            print(json.dumps({"http_status": response.status, **{
                key: result[key] for key in PUBLIC_FIELDS if key in result
            }}, ensure_ascii=False), flush=True)
        return 0
    except urllib.error.HTTPError as error:
        print(json.dumps({"http_status": error.code, "error": "callback rejected"}), flush=True)
    except Exception:
        print(json.dumps({"error": "callback failed"}), flush=True)
    return 1


if __name__ == "__main__":
    sys.exit(main())
