import os
import sys
import json

def main():
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        print("Error: GITHUB_EVENT_PATH not set.")
        sys.exit(1)
    with open(event_path, "r") as f:
        event_data = json.load(f)
    client_payload = event_data.get("client_payload", {})
    action_type = client_payload.get("action")
    print(f"Initializing Zypermail Back-End Vector Processor Engine...")
    print(f"Action Route Identified: {action_type}")
    if action_type == "register":
        username = client_payload.get("username")
        if not username:
            print("Error: Registration failed. Invalid node identity.")
            sys.exit(1)
        print(f"Account identity allocation successful for node: {username}@zypermail.com")
    elif action_type == "send_mail":
        sender = client_payload.get("sender")
        recipient = client_payload.get("recipient")
        subject = client_payload.get("subject")
        body = client_payload.get("body")
        if not all([sender, recipient, subject, body]):
            print("Error: Payload structural verification failed. Missing routing variables.")
            sys.exit(1)
        print(f"Message Vector Routed Successfully.")
        print(f"From: {sender}")
        print(f"To: {recipient}")
        print(f"Subject: {subject}")
        print(f"Payload Bytes Processed: {len(body)}")
    else:
        print(f"Warning: Fallback path executed. Unknown network dispatch action: {action_type}")

if __name__ == "__main__":
    main()
