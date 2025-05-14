import csv
from datetime import datetime
from django.shortcuts import render
from app.forms import CSVUploadForm
from app.models.event import Event

def upload_csv(request):
    if request.method == 'POST':
        form = CSVUploadForm(request.POST, request.FILES)
        if form.is_valid():
            file = request.FILES['file']
            decoded = file.read().decode('utf-8').splitlines()
            reader = csv.DictReader(decoded, delimiter='\t')  # Your CSV appears tab-delimited

            for row in reader:
                Event.objects.create(
                    game_id=row['Game ID'],
                    group=row['Group'],
                    title=row['Title'],
                    short_description=row['Short Description'],
                    long_description=row['Long Description'],
                    event_type=row['Event Type'],
                    game_system=row.get('Game System', ''),
                    rules_edition=row.get('Rules Edition', ''),
                    min_players=int(row['Minimum Players']),
                    max_players=int(row['Maximum Players']),
                    age_required=row['Age Required'],
                    experience_required=row['Experience Required'],
                    materials_required=row['Materials Required'].strip().lower() == 'yes',
                    materials_required_details=row.get('Materials Required Details', ''),
                    start_datetime=datetime.strptime(row['Start Date & Time'], '%m/%d/%y %H:%M'),
                    duration_hours=int(row['Duration']),
                    end_datetime=datetime.strptime(row['End Date & Time'], '%m/%d/%y %H:%M'),
                    gm_names=row['GM Names'],
                    website=row.get('Website', ''),
                    email=row.get('Email', ''),
                    tournament=row['Tournament?'].strip().lower() == 'yes',
                    round_number=int(row.get('Round Number', 1)),
                    total_rounds=int(row.get('Total Rounds', 1)),
                    attendee_registration=row.get('Attendee Registration?', ''),
                    cost=float(row['Cost $']),
                    location=row['Location'],
                    room_name=row.get('Room Name', ''),
                    table_number=row.get('Table Number', ''),
                    special_category=row.get('Special Category', ''),
                    tickets_available=int(row['Tickets Available']),
                    last_modified=datetime.strptime(row['Last Modified'], '%m/%d/%y').date()
                )
            return render(request, 'upload_success.html')
    else:
        form = CSVUploadForm()
    return render(request, 'upload_form.html', {'form': form})