FROM python:3.9-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

COPY ./backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt

COPY ./backend/ /root/backend/
WORKDIR /root/backend/

EXPOSE 5000
CMD ["gunicorn", "-c", "config.py", "wsgi:app"]
