/* eslint-disable */
export const displayMap = (locations) => {

  mapboxgl.accessToken = '';

  const map = new mapboxgl.Map({
    container: 'map',
    // Choose from Mapbox's core styles or make your own style with Mapbox Studio
    style: 'mapbox://styles/nikolasbaker/cm1p6b3fr00qm01r2dk6yft03',
    // scrollZoom: false
    // center: [-118.09564366805954, 39.55853763314862],
    zoom: 3
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((item) => {
    // create a marker
    const el = document.createElement(`div`);
    el.className = `marker`;

    // add the marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    }).setLngLat(item.coordinates).addTo(map);

    // add popup
    new mapboxgl.Popup({
      offset: 30
    }).setLngLat(item.coordinates).setHTML(`<p>Day ${item.day}: ${item.description}</p>`)
      .addTo(map);

    // extends the map bounds to include the current location
    bounds.extend(item.coordinates);

  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};


/*
// Create a default Marker and add it to the map.
const marker1 = new mapboxgl.Marker()
  .setLngLat([12.554729, 55.70651])
  .addTo(map);

// Create a default Marker, colored black, rotated 45 degrees.
const marker2 = new mapboxgl.Marker({ color: 'black', rotation: 45 })
  .setLngLat([12.65147, 55.608166])
  .addTo(map);
*/
