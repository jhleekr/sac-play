#!/bin/bash
cd /var/www/sacplay
. /var/www/sacplay/venv/bin/activate
cd /var/www/sacplay/sacplay
pip install -r requirements.txt
gunicorn -k uvicorn.workers.UvicornWorker --access-logfile /var/www/sacplay/gunicorn-access.log main:app --bind 0.0.0.0:7909 --workers 4