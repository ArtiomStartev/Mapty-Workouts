import { Running } from './classes/running.js';
import { Cycling } from './classes/cycling.js';
import { WorkoutType } from './enums/enums.js';
import {
  areInputFieldsNumeric,
  areInputFieldsPositive,
} from './validators/validators.js';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 15;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get user's position
    this.#getPosition();

    // Get data from local storage
    this.#getLocalStorage();

    // Attach event handlers
    this.#listenEvents();
  }

  #getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.#loadMap.bind(this), () => {
        alert("Couldn't get your position!");
      });
    }
  }

  #loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    // Here we create a map in the 'map' div
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#workouts.forEach(workout => this.#renderWorkoutMarker(workout));

    // Handling clicks on the map
    this.#map.on('click', this.#showForm.bind(this));
  }

  #showForm(event) {
    this.#mapEvent = event;

    form.classList.remove('hidden');
    inputDistance.focus();
  }

  #hideForm() {
    // Empty input fields
    inputDistance.value = '';
    inputDuration.value = '';
    inputCadence.value = '';
    inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  #newWorkout(event) {
    event.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    if (type === WorkoutType.Running) {
      const cadence = +inputCadence.value;

      if (
        !areInputFieldsNumeric(distance, duration, cadence) ||
        !areInputFieldsPositive(distance, duration, cadence)
      ) {
        return alert('Please enter valid positive numbers!');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === WorkoutType.Cycling) {
      const elevation = +inputElevation.value;

      if (
        !areInputFieldsNumeric(distance, duration, elevation) ||
        !areInputFieldsPositive(distance, duration)
      ) {
        return alert('Please enter valid positive numbers!');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to #workouts array
    this.#workouts.push(workout);

    // Render workout on the map as a marker
    this.#renderWorkoutMarker(workout);

    // Render workout on the list
    this.#renderWorkout(workout);

    // Hide form and clear input fields
    this.#hideForm();

    // Set local storage to all workouts
    this.#setLocalStorage();
  }

  #renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === WorkoutType.Running ? '🏃' : '🚴‍'}
         ${workout.description}`
      )
      .openPopup();
  }

  #renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === WorkoutType.Running ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === WorkoutType.Running) {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }

    if (workout.type === WorkoutType.Cycling) {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  #listenEvents() {
    form.addEventListener('submit', this.#newWorkout.bind(this));

    inputType.addEventListener('change', () => {
      this.#toggleInputFieldVisibility(inputElevation);
      this.#toggleInputFieldVisibility(inputCadence);
    });

    containerWorkouts.addEventListener('click', this.#moveToPopup.bind(this));
  }

  #toggleInputFieldVisibility(element) {
    element.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #moveToPopup(event) {
    const workoutEl = event.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      item => item.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  #setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #getLocalStorage() {
    const workouts = JSON.parse(localStorage.getItem('workouts'));

    if (workouts) {
      this.#workouts = workouts;
      this.#workouts.forEach(workout => this.#renderWorkout(workout));
    }
  }
}

const app = new App();
