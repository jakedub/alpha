import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alpha.settings')

app = Celery('alpha')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()