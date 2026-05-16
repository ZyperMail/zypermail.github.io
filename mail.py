import os
import sys
import json
import urllib.request

def main():
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    api_key = os.environ.get("RESEND_API_KEY")
    if not event_path:
        print("Error: GITHUB_EVENT_PATH not set.")
        sys.exit(1)
    if not api_key:
        print("Error: RESEND_API_KEY environment variable is missing.")
        sys.exit(1)
    with open(event_path, "r") as f:
        event_data = json.load(f)
    client_payload = event_data.get("client_payload", {})
    action_type = client_payload.get("action")
    if action_type == "send_mail":
        sender = client_payload.get("sender")
        recipient = client_payload.get("recipient")
        subject = client_payload.get("subject")
        body = client_payload.get("body")
        if not all([sender, recipient, subject, body]):
            print("Error: Missing routing variables.")
            sys.exit(1)
        if not recipient.endswith("@zypermail.com"):
            print(f"External routing path detected. Relaying payload to: {recipient}")
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": "Zypermail Engine <delivered@zypermail.com>",
                "to": recipient,
                "subject": f"[{sender}] {subject}",
                "text": body
            }
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers=headers, method="POST")
            try:
                with urllib.request.urlopen(req) as response:
                    res_body = response.read().decode("utf-8")
                    print(f"External relay successful. API Response: {res_body}")
            except Exception as e:
                print(f"Network delivery failure: {e}")
                sys.exit(1)
        else:
            print(f"Internal delivery routed successfully to local box: {recipient}")

if __name__ == "__main__":
    main()
