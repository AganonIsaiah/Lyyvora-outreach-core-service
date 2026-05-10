import boto3
from botocore.exceptions import ClientError
from configs.configs import EMAIL_SENDER, AWS_REGION


def get_ses_client():
    return boto3.client("ses", region_name=AWS_REGION)


def send_email(
    recipient: str, subject: str, body_html: str, body_text: str = None
) -> None:
    client = get_ses_client()

    body = {"Html": {"Data": body_html, "Charset": "UTF-8"}}
    if body_text:
        body["Text"] = {"Data": body_text, "Charset": "UTF-8"}

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
