import { Workout } from './workout.js';
import { WorkoutType } from '../enums/enums.js';

export class Running extends Workout {
  type = WorkoutType.Running;

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;

    this.#calcPace();
    this._setDescription();
  }

  #calcPace() {
    this.pace = this.duration / this.distance; // min/km
    return this.pace;
  }
}
