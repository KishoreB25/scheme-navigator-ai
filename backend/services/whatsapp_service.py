"""
WhatsApp Service for PolicySetu
Wraps Twilio WhatsApp Business API for:
  - Sending scheme alerts to subscribed users
  - Handling incoming WhatsApp messages → pipeline → reply
  - Batch missed-benefits notifications

For prototyping, uses Twilio Sandbox.
For production, can switch to Meta WhatsApp Cloud API.
"""

from typing import Dict, List, Optional
from datetime import datetime

from config.settings import settings


class WhatsAppService:
    """Twilio WhatsApp integration for scheme notifications."""

    def __init__(self):
        self._client = None
        self._available = False
        self._initialize()

    def _initialize(self):
        """Initialize Twilio client if credentials are available."""
        if not settings.twilio_account_sid or not settings.twilio_auth_token:
            print("[WhatsApp] No Twilio credentials found. WhatsApp service disabled.")
            return

        try:
            from twilio.rest import Client
            self._client = Client(
                settings.twilio_account_sid,
                settings.twilio_auth_token,
            )
            self._available = True
            print("[WhatsApp] Twilio client initialized successfully")
        except ImportError:
            print("[WhatsApp] twilio package not installed. Run: pip install twilio")
        except Exception as e:
            print(f"[WhatsApp] Failed to initialize Twilio: {e}")
    @property
    def is_available(self) -> bool:
        return self._available

    def _format_phone(self, phone: str) -> str:
        """Ensure phone number is in WhatsApp format: whatsapp:+91XXXXXXXXXX"""
        phone = phone.strip()
        if phone.startswith("whatsapp:"):
            return phone
        if not phone.startswith("+"):
            # Assume Indian number
            if phone.startswith("91"):
                phone = f"+{phone}"
            else:
                phone = f"+91{phone}"
        return f"whatsapp:{phone}"

    def send_message(self, to_phone: str, body: str) -> Dict:
        """
        Send a WhatsApp message via Twilio.
        Returns {"sent": bool, "sid": str|None, "error": str|None}
        """
        if not self._available:
            return {
                "sent": False,
                "sid": None,
                "error": "WhatsApp service not configured",
            }

        try:
            message = self._client.messages.create(
                from_=settings.twilio_whatsapp_from,
                to=self._format_phone(to_phone),
                body=body,
            )
            return {
                "sent": True,
                "sid": message.sid,
                "error": None,
            }
        except Exception as e:
            print(f"[WhatsApp] Send failed: {e}")
            return {
                "sent": False,
                "sid": None,
                "error": str(e)[:200],
            }

    def send_scheme_alert(
        self,
        phone: str,
        scheme_name: str,
        summary: str,
        apply_link: str,
    ) -> Dict:
        """Send a single scheme alert to a user."""
        body = (
            f"🏛️ *PolicySetu Alert*\n\n"
            f"📋 *{scheme_name}*\n"
            f"{summary[:300]}\n\n"
            f"🔗 Apply here: {apply_link}\n\n"
            f"_Reply with the scheme name for more details._"
        )
        return self.send_message(phone, body)

    def send_missed_benefits(
        self,
        phone: str,
        schemes: List[Dict],
    ) -> Dict:
        """Send a batch alert with missed benefits."""
        if not schemes:
            return {"sent": False, "error": "No schemes to notify about"}

        body = (
            f"🔔 *PolicySetu — Missed Benefits Alert*\n\n"
            f"We found *{len(schemes)} scheme(s)* you might be eligible for:\n\n"
        )

        for i, scheme in enumerate(schemes[:5], 1):  # Max 5 per message
            name = scheme.get("scheme_name", scheme.get("name", "Unknown"))
            link = scheme.get("official_link", "N/A")
            body += f"{i}. *{name}* — {link}\n"

        body += (
            f"\n_Visit PolicySetu for full details and eligibility checks._\n"
            f"_Reply STOP to unsubscribe._"
        )

        return self.send_message(phone, body)

    def handle_incoming(
        self,
        message_body: str,
        from_phone: str,
        orchestrator=None,
    ) -> str:
        """
        Process an incoming WhatsApp message through the pipeline.
        Returns the response text to send back.
        """
        if not message_body or not message_body.strip():
            return "Please send a query about government schemes. Example: 'schemes for farmers'"

        # Handle special commands
        command = message_body.strip().lower()
        if command == "stop":
            return "You've been unsubscribed from PolicySetu alerts. Reply START to re-subscribe."
        if command == "start":
            return "Welcome back! 🙏 You're now subscribed to PolicySetu alerts."
        if command == "help":
            return (
                "🏛️ *PolicySetu Help*\n\n"
                "Ask me about government schemes:\n"
                "• _schemes for farmers_\n"
                "• _am I eligible for PM Kisan?_\n"
                "• _how to apply for MUDRA loan_\n\n"
                "Reply STOP to unsubscribe."
            )

        # Run through the orchestrator pipeline
        if orchestrator:
            try:
                result = orchestrator.run_pipeline(
                    query=message_body,
                    user_profile={},
                )
                response = result.get("response_text", "Sorry, I couldn't process your query.")

                # Append scheme links for WhatsApp
                for scheme in result.get("schemes", [])[:3]:
                    name = scheme.get("name", "")
                    link = scheme.get("official_link", "")
                    if name and link:
                        response += f"\n\n📋 *{name}*: {link}"

                return response
            except Exception as e:
                print(f"[WhatsApp] Pipeline error: {e}")
                return "Sorry, something went wrong. Please try again."

        return "PolicySetu is currently unavailable. Please try again later."
