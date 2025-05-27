// static/js/map_picker.js
document.addEventListener('DOMContentLoaded', function () {
    const latInput = document.querySelector('#id_latitude');
    const lngInput = document.querySelector('#id_longitude');

    if (latInput && lngInput) {
        const mapDiv = document.createElement('div');
        mapDiv.id = 'mapid';
        mapDiv.style = 'height: 400px; margin-top: 10px;';
        lngInput.parentNode.appendChild(mapDiv);

        const lat = parseFloat(latInput.value) || 39.7684;
        const lng = parseFloat(lngInput.value) || -86.1581;

        const map = L.map('mapid').setView([lat, lng], 17);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 22,
        }).addTo(map);

        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

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
    }
});