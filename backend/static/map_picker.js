document.addEventListener('DOMContentLoaded', function () {
    const latInput = document.querySelector('[data-map-lat="true"]');
    const lngInput = document.querySelector('[data-map-lng="true"]');

    if (!latInput || !lngInput) {
        console.warn("Latitude or longitude input not found.");
        return;
    }

    // Create and insert the map container after the longitude field
    const mapDiv = document.createElement('div');
    mapDiv.id = 'mapid';
    mapDiv.style = 'height: 400px; margin-top: 15px; border: 1px solid #ccc;';
    lngInput.closest('.form-row, .form-group').appendChild(mapDiv);

    // Fallback coordinates if none are set
    const defaultLat = parseFloat(latInput.value) || 39.7684;
    const defaultLng = parseFloat(lngInput.value) || -86.1581;

    const map = L.map('mapid').setView([defaultLat, defaultLng], 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 22,
    }).addTo(map);

    const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
    }).addTo(map);

    marker.on('dragend', function (e) {
        const pos = marker.getLatLng();
        latInput.value = pos.lat.toFixed(6);
        lngInput.value = pos.lng.toFixed(6);
    });

    map.on('click', function (e) {
        marker.setLatLng(e.latlng);
        latInput.value = e.latlng.lat.toFixed(6);
        lngInput.value = e.latlng.lng.toFixed(6);
    });
});