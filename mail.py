import os
import sys
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def main():
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    smtp_host = os.environ.get("ZYPERMAIL_SMTP_HOST")
    smtp_port = os.environ.get("ZYPERMAIL_SMTP_PORT")
    smtp_user = os.environ.get("ZYPERMAIL_SMTP_USER")
    smtp_pass = os.environ.get("ZYPERMAIL_SMTP_PASSWORD")
    if not event_path:
        print("Error: GITHUB_EVENT_PATH not set.")
        sys.exit(1)
    if not all([smtp_host, smtp_port, smtp_user, smtp_pass]):
        print("Error: Provider core SMTP configurations are missing.")
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
            print("Error: Payload parameters invalid.")
            sys.exit(1)
        if not recipient.endswith("@zypermail.com"):
            print(f"Routing transaction from external gateway to target node: {recipient}")
            msg = MIMEMultipart()
            msg["From"] = f"{sender.split('@')[0]} <{smtp_user}>"
            msg["To"] = recipient
            msg["Subject"] = subject
            msg["Reply-To"] = sender
            msg.attach(MIMEText(body, "plain", "utf-8"))
            try:
                server = smtplib.SMTP(smtp_host, int(smtp_port))
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, recipient, msg.as_string())
                server.quit()
                print("Provider transmission complete. Dispatched to destination server.")
            except Exception as e:
                print(f"SMTP Gateway transmission failure: {e}")
                sys.exit(1)
        else:
            print(f"Internal delivery loop complete. Target node: {recipient}")

if __name__ == "__main__":
    main()
