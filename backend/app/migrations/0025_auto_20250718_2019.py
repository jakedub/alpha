from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('app', '0024_alter_userwatchedevent_unique_together_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userwatchedevent',
            name='gencon_event_id',
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
    ]