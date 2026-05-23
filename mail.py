import os
import sys
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def main():
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASSWORD")

    if not event_path or not all([smtp_host, smtp_port, smtp_user, smtp_pass]):
        print("Error: Required configuration or event path missing.")
        sys.exit(1)

    with open(event_path, "r") as f:
        event_data = json.load(f)

    client_payload = event_data.get("client_payload", {})
    if client_payload.get("action") == "send_mail":
        sender = client_payload.get("sender")
        recipient = client_payload.get("recipient")
        subject = client_payload.get("subject")
        body = client_payload.get("body")

        if not all([sender, recipient, subject, body]):
            sys.exit(1)

        msg = MIMEMultipart()
        msg["From"] = sender
        msg["To"] = recipient
        msg["Subject"] = subject
        msg["Reply-To"] = sender
        msg.attach(MIMEText(body, "plain", "utf-8"))

        try:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender, recipient, msg.as_string())
            print("Dispatch successful.")
        except Exception as e:
            print(f"Transmission failure: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
