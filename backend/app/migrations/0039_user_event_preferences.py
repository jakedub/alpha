from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0038_notification'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='pref_event_types',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='user',
            name='pref_locations',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='user',
            name='pref_age_requirements',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='user',
            name='pref_experience_levels',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
