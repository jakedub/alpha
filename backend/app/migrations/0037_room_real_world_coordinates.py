from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0036_vendor_map_polygon'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='real_world_latitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='room',
            name='real_world_longitude',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
