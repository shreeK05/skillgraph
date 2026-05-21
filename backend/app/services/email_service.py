# file: backend/app/services/email_service.py
"""
Email service using Gmail SMTP with Jinja2 HTML templates.
All email functions are fire-and-forget (non-blocking).
"""
import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional
from app.core.config import settings


def _send_smtp(to_emails: List[str], subject: str, html_body: str):
    """Internal: actually sends via Gmail SMTP. Called in a background thread."""
    if not settings.GMAIL_SENDER_EMAIL or not settings.GMAIL_APP_PASSWORD:
        print(f"[Email] SMTP not configured. Would send to {to_emails}: {subject}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"SkillGraph VIT Pune <{settings.GMAIL_SENDER_EMAIL}>"
        msg["To"] = ", ".join(to_emails)
        msg.attach(MIMEText(html_body, "html"))
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.GMAIL_SENDER_EMAIL, settings.GMAIL_APP_PASSWORD)
            server.sendmail(settings.GMAIL_SENDER_EMAIL, to_emails, msg.as_string())
        print(f"[Email] Sent '{subject}' to {to_emails}")
    except Exception as e:
        print(f"[Email] Failed to send '{subject}': {e}")


def send_async(to_emails: List[str], subject: str, html_body: str):
    """Send email in a background thread (non-blocking)."""
    thread = threading.Thread(target=_send_smtp, args=(to_emails, subject, html_body), daemon=True)
    thread.start()


# ---- Email Templates ----

BASE_STYLE = """
  font-family: 'Segoe UI', Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #0f172a;
  color: #f1f5f9;
  border-radius: 16px;
  overflow: hidden;
"""

def _wrap(content: str, footer: str = "") -> str:
    return f"""
    <!DOCTYPE html><html><body style="background:#020617;padding:20px">
    <div style="{BASE_STYLE}">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center">
        <h1 style="margin:0;color:white;font-size:24px;font-weight:800">SkillGraph</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px">VIT Pune Placement Platform</p>
      </div>
      <div style="padding:32px">{content}</div>
      <div style="background:#1e293b;padding:20px;text-align:center;font-size:12px;color:#64748b">
        {footer or 'SkillGraph &bull; VIT Pune &bull; Automated email, do not reply'}
      </div>
    </div></body></html>
    """


def send_otp_email(to_email: str, otp: str, name: str = "Student"):
    content = f"""
      <h2 style="color:#a5b4fc;margin-top:0">Verify Your Email</h2>
      <p>Hi {name}! Welcome to SkillGraph. Use this OTP to verify your email:</p>
      <div style="background:#1e293b;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
        <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#818cf8">{otp}</span>
      </div>
      <p style="color:#94a3b8;font-size:13px">This OTP expires in 10 minutes. Do not share it with anyone.</p>
    """
    send_async([to_email], "Verify your SkillGraph account", _wrap(content))


def send_welcome_email(to_email: str, name: str, role: str):
    role_map = {"STUDENT": "Student Portal", "DEPT_ADMIN": "Department Portal", "COMPANY": "Company Portal"}
    portal = role_map.get(role, "Portal")
    content = f"""
      <h2 style="color:#a5b4fc;margin-top:0">Welcome to SkillGraph! 🎉</h2>
      <p>Hi {name}! Your account has been created successfully.</p>
      <p>You now have access to the <strong style="color:#818cf8">{portal}</strong>.</p>
      <a href="{settings.FRONTEND_URL}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px">Get Started →</a>
    """
    send_async([to_email], "Welcome to SkillGraph — VIT Pune", _wrap(content))


def send_shortlist_email(to_email: str, student_name: str, company_name: str, role: str):
    content = f"""
      <h2 style="color:#34d399;margin-top:0">🎊 You've been Shortlisted!</h2>
      <p>Congratulations <strong>{student_name}</strong>!</p>
      <p><strong style="color:#818cf8">{company_name}</strong> has shortlisted you for the role of <strong>{role}</strong>.</p>
      <p>Check your SkillGraph dashboard for next steps and interview schedule.</p>
      <a href="{settings.FRONTEND_URL}/student/jobs" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px">View Dashboard →</a>
    """
    send_async([to_email], f"🎊 Shortlisted by {company_name} — SkillGraph", _wrap(content))


def send_announcement_email(to_emails: List[str], sender_name: str, title: str, body: str):
    content = f"""
      <h2 style="color:#a5b4fc;margin-top:0">📢 {title}</h2>
      <p style="color:#94a3b8;font-size:13px">From: <strong style="color:#e2e8f0">{sender_name}</strong></p>
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin:16px 0;line-height:1.7">{body}</div>
      <a href="{settings.FRONTEND_URL}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px">View on SkillGraph →</a>
    """
    send_async(to_emails, f"📢 {title} — SkillGraph", _wrap(content))


def send_interview_invite_email(to_email: str, student_name: str, company_name: str, role: str, interview_date: str, interview_link: str = None):
    link_html = f'<a href="{interview_link}" style="color:#818cf8">Join Interview</a>' if interview_link else ""
    content = f"""
      <h2 style="color:#fbbf24;margin-top:0">📅 Interview Invitation</h2>
      <p>Dear {student_name},</p>
      <p><strong style="color:#818cf8">{company_name}</strong> has invited you for an interview:</p>
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin:16px 0">
        <p style="margin:4px 0"><strong>Role:</strong> {role}</p>
        <p style="margin:4px 0"><strong>Date/Time:</strong> {interview_date}</p>
        {('<p style="margin:4px 0"><strong>Link:</strong> ' + link_html + '</p>') if interview_link else ''}
      </div>
      <p style="color:#94a3b8;font-size:13px">Please be prepared and punctual. Best of luck! 🍀</p>
    """
    send_async([to_email], f"Interview Invitation from {company_name} — SkillGraph", _wrap(content))
