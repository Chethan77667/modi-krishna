import os
from datetime import datetime
from functools import wraps
from io import BytesIO

import pandas as pd
from fpdf import FPDF
from flask import (
    Flask,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    send_file,
    session,
    url_for,
)
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from pymongo import MongoClient, errors

from data import (
    current_year,
    dignitaries,
    events,
    gallery_slides,
    hero_story,
    highlights,
    schedule,
    storyline,
)

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "change-this-in-production")
app.config["ADMIN_USERNAME"] = os.environ.get("ADMIN_USERNAME", "bbhcadmin")
app.config["ADMIN_PASSWORD"] = os.environ.get("ADMIN_PASSWORD", "bbhc@2005")
app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
app.config["MONGO_DB_NAME"] = os.environ.get("MONGO_DB_NAME", "krishna_event")

DEFAULT_COLLEGES = [
    "Dr. B. B. Hegde First Grade College, Kundapura",
    "Govinda Dasa College, Surathkal",
    "Sri Bhuvanendra College, Karkala",
    "MGM College, Udupi",
    "Bhandarkars' Arts & Science College, Kundapura",
]

DEFAULT_COURSES = [
    "BCA",
    "B.Com",
    "B.Sc",
    "B.A",
    "MBA",
    "MCA",
]

mongo_client = None
mongo_db = None


def get_db():
    """Return MongoDB database handle or None if unavailable."""
    global mongo_client, mongo_db
    if mongo_db is not None:
        return mongo_db

    try:
        mongo_client = MongoClient(
            app.config["MONGO_URI"],
            serverSelectionTimeoutMS=3000,
        )
        mongo_client.admin.command("ping")
        mongo_db = mongo_client[app.config["MONGO_DB_NAME"]]
    except errors.PyMongoError as exc:
        app.logger.error("MongoDB connection failed: %s", exc)
        mongo_db = None

    return mongo_db


def get_form_options():
    """Fetch college and course options from MongoDB."""
    db = get_db()
    if db is None:
        return DEFAULT_COLLEGES, DEFAULT_COURSES

    doc = db.meta.find_one({"_id": "form_options"}) or {}
    colleges = doc.get("colleges") or DEFAULT_COLLEGES
    courses = doc.get("courses") or DEFAULT_COURSES
    return colleges, courses


def save_form_options(colleges, courses):
    db = get_db()
    if db is None:
        return False

    db.meta.update_one(
        {"_id": "form_options"},
        {"$set": {"colleges": colleges, "courses": courses}},
        upsert=True,
    )
    return True


def fetch_registrations():
    db = get_db()
    if db is None:
        return []

    registrations = []
    for entry in db.registrations.find().sort("created_at", -1):
        entry["_id"] = str(entry["_id"])
        registrations.append(entry)
    return registrations


def admin_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        if not session.get("admin_authenticated"):
            flash("Please sign in to access the admin console.", "warning")
            return redirect(url_for("admin_login"))
        return view_func(*args, **kwargs)

    return wrapper


def db_unavailable_message():
    flash(
        "The registration database is currently unreachable. "
        "Please try again once connectivity is restored.",
        "danger",
    )


def format_timestamp(value):
    if isinstance(value, datetime):
        return value.strftime("%d %b %Y · %I:%M %p")
    return value or ""


def get_gallery_images():
    """Get all images from static/images folder."""
    image_dir = os.path.join(app.static_folder, "images")
    gallery_images = []

    if os.path.exists(image_dir):
        image_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}

        for filename in os.listdir(image_dir):
            lower_name = filename.lower()
            if (
                "logo" in lower_name
                or "hero" in lower_name
                or "pm modi-30oct25" in lower_name
                or "png-clipart-happy-krishna-janmashtami" in lower_name
                or "krishna-alankara-3.webp" in lower_name
                or "main_image.jpg" in lower_name
                or "udupi-krishna-idol.jpg" in lower_name
                or "udupi-krishna.webp" in lower_name
                or "yogi-sants-gathering.jpg" in lower_name
            ):
                continue

            _, ext = os.path.splitext(filename.lower())
            if ext in image_extensions:
                caption = (
                    filename.replace("-", " ")
                    .replace("_", " ")
                    .replace(ext, "")
                )
                caption = " ".join(word.capitalize() for word in caption.split())

                gallery_images.append(
                    {
                        "src": url_for("static", filename=f"images/{filename}"),
                        "caption": caption,
                        "title": caption,
                        "subtitle": "Sri Krishna Math · Devotional Moment",
                    }
                )

    return gallery_images if gallery_images else gallery_slides


@app.context_processor
def inject_layout_tokens():
    return {
        "brand": "Laksha Kantha Geetha Parayana",
        "year": current_year(),
        "nav_links": [
            {"href": "/", "label": "Home"},
            {"href": "/gallery", "label": "Gallery"},
            {"href": "/about", "label": "About"},
            {"href": "/register", "label": "Register"},
        ],
    }


@app.route("/")
def home():
    return render_template(
        "home.html",
        hero=hero_story,
        highlights=highlights,
        schedule=schedule,
        events=events,
        dignitaries=dignitaries,
        storyline=storyline,
        gallery_preview=gallery_slides[:3],
    )


@app.route("/gallery")
def gallery():
    gallery_images = get_gallery_images()
    return render_template("gallery.html", hero=hero_story, gallery=gallery_images)


@app.route("/about")
def about():
    return render_template(
        "about.html",
        hero=hero_story,
        storyline=storyline,
        dignitaries=dignitaries,
    )


@app.route("/api/events")
def api_events():
    return jsonify(events)


@app.route("/register", methods=["GET", "POST"])
def register():
    colleges, courses = get_form_options()
    db = get_db()

    if request.method == "POST":
        form_data = {
            "name": request.form.get("name", "").strip(),
            "college": request.form.get("college", "").strip(),
            "course": request.form.get("course", "").strip(),
            "phone": request.form.get("phone", "").strip(),
            "email": request.form.get("email", "").strip(),
            "created_at": datetime.utcnow(),
        }

        errors_list = []
        if not form_data["name"]:
            errors_list.append("Please enter your full name.")
        if not form_data["college"]:
            errors_list.append("Please select your college.")
        if not form_data["course"]:
            errors_list.append("Please select your course.")
        if not form_data["phone"] or len(form_data["phone"]) < 8:
            errors_list.append("Please provide a valid phone number.")
        if not form_data["email"] or "@" not in form_data["email"]:
            errors_list.append("Please provide a valid email address.")

        if errors_list:
            for issue in errors_list:
                flash(issue, "danger")
            return render_template(
                "register.html",
                hero=hero_story,
                colleges=colleges,
                courses=courses,
            )

        if db is None:
            db_unavailable_message()
            return (
                render_template(
                    "register.html",
                    hero=hero_story,
                    colleges=colleges,
                    courses=courses,
                ),
                503,
            )

        db.registrations.insert_one(form_data)
        session["registration_success"] = True
        flash("Jai Sri Krishna! Your registration is confirmed.", "success")
        return redirect(url_for("register"))

    registration_success = session.pop("registration_success", False)

    return render_template(
        "register.html",
        hero=hero_story,
        colleges=colleges,
        courses=courses,
        registration_success=registration_success,
    )


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        if (
            username == app.config["ADMIN_USERNAME"]
            and password == app.config["ADMIN_PASSWORD"]
        ):
            session["admin_authenticated"] = True
            flash("Welcome back, administrator.", "success")
            return redirect(url_for("admin_dashboard"))
        flash("Invalid credentials. Try again.", "danger")

    return render_template("admin_login.html", hero=hero_story)


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin_authenticated", None)
    flash("You have been signed out.", "info")
    return redirect(url_for("admin_login"))


@app.route("/admin", methods=["GET"])
@admin_required
def admin_dashboard():
    registrations = fetch_registrations()
    colleges, courses = get_form_options()
    db_connected = get_db() is not None
    total_registrations = len(registrations)

    return render_template(
        "admin_dashboard.html",
        hero=hero_story,
        registrations=registrations,
        colleges=colleges,
        courses=courses,
        db_connected=db_connected,
        total_registrations=total_registrations,
    )


@app.route("/admin/options", methods=["POST"])
@admin_required
def admin_update_options():
    option_type = request.form.get("option_type")
    action = request.form.get("action", "add")
    value = request.form.get("value", "").strip()

    colleges, courses = get_form_options()
    if option_type not in {"college", "course"} or not value:
        flash("Please provide a valid value.", "danger")
        return redirect(url_for("admin_dashboard"))

    target_list = list(colleges if option_type == "college" else courses)

    if action == "remove":
        if value in target_list:
            target_list.remove(value)
    else:
        if value not in target_list:
            target_list.append(value)

    if option_type == "college":
        colleges = target_list
    else:
        courses = target_list

    saved = save_form_options(colleges, courses)
    if saved:
        flash("Options updated successfully.", "success")
    else:
        db_unavailable_message()
    return redirect(url_for("admin_dashboard"))


@app.route("/admin/export/excel")
@admin_required
def export_excel():
    registrations = fetch_registrations()
    if not registrations:
        flash("No registrations to export.", "warning")
        return redirect(url_for("admin_dashboard"))

    dataframe = pd.DataFrame(
        [
            {
                "Name": reg.get("name"),
                "College": reg.get("college"),
                "Course": reg.get("course"),
                "Phone": reg.get("phone"),
                "Email": reg.get("email"),
                "Registered On": format_timestamp(reg.get("created_at")),
            }
            for reg in registrations
        ]
    )
    buffer = BytesIO()
    report_name = "Laksha Kantha Geetha Parayana Registration Sheet"
    report_date = datetime.utcnow().strftime("%d-%m-%Y")
    with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
        dataframe.to_excel(
            writer, index=False, sheet_name="Registrations", startrow=2
        )
        worksheet = writer.sheets["Registrations"]

        worksheet.merge_cells(
            start_row=1,
            start_column=1,
            end_row=1,
            end_column=len(dataframe.columns),
        )
        title_cell = worksheet.cell(row=1, column=1)
        title_cell.value = report_name
        title_cell.font = Font(size=16, bold=True, color="1A237E")
        title_cell.alignment = Alignment(horizontal="center")

        worksheet.merge_cells(
            start_row=2,
            start_column=1,
            end_row=2,
            end_column=len(dataframe.columns),
        )
        date_cell = worksheet.cell(row=2, column=1)
        date_cell.value = f"Date: {report_date}"
        date_cell.font = Font(size=12, italic=True, color="555555")
        date_cell.alignment = Alignment(horizontal="center")

        header_row = 3
        header_fill = PatternFill("solid", fgColor="0B0A08")
        header_font = Font(color="FFFFFF", bold=True)
        thin_border = Border(
            left=Side(style="thin", color="CCCCCC"),
            right=Side(style="thin", color="CCCCCC"),
            top=Side(style="thin", color="CCCCCC"),
            bottom=Side(style="thin", color="CCCCCC"),
        )
        for col_idx, column in enumerate(dataframe.columns, start=1):
            cell = worksheet.cell(row=header_row, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = thin_border

        for idx, column in enumerate(dataframe.columns, start=1):
            max_len = len(column)
            column_series = dataframe[column].astype(str)
            if not column_series.empty:
                max_len = max(max_len, column_series.map(len).max())
            worksheet.column_dimensions[get_column_letter(idx)].width = max_len + 2

        for row in worksheet.iter_rows(
            min_row=header_row + 1,
            max_row=worksheet.max_row,
            min_col=1,
            max_col=len(dataframe.columns),
        ):
            for cell in row:
                cell.border = thin_border

    buffer.seek(0)
    filename = "registrations.xlsx"
    return send_file(
        buffer,
        as_attachment=True,
        download_name=filename,
        mimetype=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
    )


@app.route("/admin/export/pdf")
@admin_required
def export_pdf():
    registrations = fetch_registrations()
    if not registrations:
        flash("No registrations to export.", "warning")
        return redirect(url_for("admin_dashboard"))

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Laksha Kantha Geetha Parayana Registrations", ln=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, datetime.utcnow().strftime("Date: %d-%m-%Y"), ln=True)
    pdf.ln(6)

    headers = ["Name", "College", "Course", "Phone", "Email", "Registered On"]
    col_widths = [32, 45, 25, 28, 45, 35]
    usable_width = pdf.w - 2 * pdf.l_margin
    width_scale = usable_width / sum(col_widths)
    col_widths = [w * width_scale for w in col_widths]

    pdf.set_font("Helvetica", "B", 11)
    pdf.set_fill_color(26, 35, 126)
    pdf.set_text_color(255, 255, 255)
    for header, width in zip(headers, col_widths):
        pdf.cell(width, 8, header, border=1, align="C", fill=True)
    pdf.ln()

    pdf.set_font("Helvetica", size=10)
    pdf.set_text_color(40, 40, 40)
    line_height = 6

    def split_text(text, width):
        lines = pdf.multi_cell(width, line_height, text, split_only=True)
        return lines or [""]

    for index, reg in enumerate(registrations):
        row = [
            reg.get("name", ""),
            reg.get("college", ""),
            reg.get("course", ""),
            reg.get("phone", ""),
            reg.get("email", ""),
            format_timestamp(reg.get("created_at")),
        ]
        row_lines = [
            split_text(text, width) for text, width in zip(row, col_widths)
        ]
        max_lines = max(len(lines) for lines in row_lines)
        row_height = max_lines * line_height

        if index % 2 == 0:
            pdf.set_fill_color(255, 255, 255)
        else:
            pdf.set_fill_color(245, 245, 245)

        y_start = pdf.get_y()
        x_pos = pdf.l_margin
        for width in col_widths:
            pdf.set_xy(x_pos, y_start)
            pdf.cell(width, row_height, "", border=1, fill=True)
            x_pos += width

        pdf.set_xy(pdf.l_margin, y_start)
        for lines, width in zip(row_lines, col_widths):
            x = pdf.get_x()
            y = pdf.get_y()
            pdf.multi_cell(
                width,
                line_height,
                "\n".join(lines),
                border=0,
                align="L",
            )
            pdf.set_xy(x + width, y)
        pdf.set_xy(pdf.l_margin, y_start + row_height)

    pdf_data = pdf.output(dest="S")
    if isinstance(pdf_data, str):
        pdf_bytes = pdf_data.encode("latin1")
    else:
        pdf_bytes = bytes(pdf_data)
    buffer = BytesIO(pdf_bytes)
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name="registrations.pdf",
        mimetype="application/pdf",
    )


if __name__ == "__main__":
    app.run(debug=True, port=5001)