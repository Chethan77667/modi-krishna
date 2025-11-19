# Laksha Geeta Pathana Microsite

Flask-powered concept site inspired by the upcoming visit of Prime Minister Narendra Modi to Sri Krishna Math, Udupi. The experience follows the aesthetic cues of the Janmashtami reference site while adding a custom narrative for the “Laksha Geeta Pathana” program.

## Structure

- `app.py` – Flask server with routes for Home, Gallery, About and an `api/events` endpoint.
- `data.py` – Centralised content describing the hero story, schedule, dignitaries, and gallery.
- `templates/` – Jinja templates built over a glassmorphic gradient layout.
- `static/` – Global styles, animations, and curated imagery.

## Running Locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Visit `http://127.0.0.1:5001/`.

## Concept Notes

- Theme colours echo the twilight hues of Sri Krishna Math with golden accents for Kanaka Kavacha.
- Animations are kept subtle to mirror the collective breath of one lakh devotees.
- Content references official announcements: Gita Utsava timeline, Sant Sangama, Bhajanotsava, and the Prime Minister’s darshan schedule.

