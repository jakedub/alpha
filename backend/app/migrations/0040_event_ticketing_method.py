from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0039_user_event_preferences'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='ticketing_method',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
