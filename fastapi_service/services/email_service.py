import re
import boto3
from botocore.exceptions import ClientError
from configs.configs import EMAIL_SENDER, AWS_REGION
from configs.prompt_templates import CALENDER_LINK

_LINK_STYLE = "color:#1d4ed8;text-decoration:underline;font-weight:600;"

_NAMED_LINKS: list[tuple[str, str, str]] = [
    (CALENDER_LINK, "Book a time here", _LINK_STYLE),
    ("https://lyyvora.com", "Explore Lyyvora", _LINK_STYLE),
    ("http://lyyvora.com", "Explore Lyyvora", _LINK_STYLE),
]

_URL_RE = re.compile(r'(https?://[^\s<>"\']+)')


def _build_anchor(href: str, label: str, style: str) -> str:
    return f'<a href="{href}" style="{style}">{label}</a>'


def _linkify(text: str) -> str:
    # Apply named substitutions first (custom labels)
    for url, label, style in _NAMED_LINKS:
        text = text.replace(url, _build_anchor(url, label, style))
    # Wrap any remaining bare URLs with plain styled anchors
    return _URL_RE.sub(
        lambda m: _build_anchor(m.group(1), m.group(1), _LINK_STYLE),
        text,
    )


def get_ses_client():
    return boto3.client("ses", region_name=AWS_REGION)


def _wrap_html(content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#333;max-width:600px;margin:0 auto;padding:24px;">
{content}
</body>
</html>"""


def send_email(
    recipient: str, subject: str, body_html: str, body_text: str = None
) -> None:
    client = get_ses_client()

    html = _wrap_html(_linkify(body_html.replace("\n", "<br>")))
    # Always include a plain-text alternative — multipart/alternative passes
    # security gateways more reliably and is email best practice
    plain = body_text or body_html
    body = {
        "Html": {"Data": html, "Charset": "UTF-8"},
        "Text": {"Data": plain, "Charset": "UTF-8"},
    }

    try:
        client.send_email(
            Source=EMAIL_SENDER,
            Destination={"ToAddresses": [recipient]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": body,
            },
        )
    except ClientError as e:
        raise RuntimeError(f"SES send failed: {e.response['Error']['Message']}")
