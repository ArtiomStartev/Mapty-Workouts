import { Workout } from './workout.js';
import { WorkoutType } from '../enums/enums.js';

export class Cycling extends Workout {
  type = WorkoutType.Cycling;

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;

    this.#calcSpeed();
    this._setDescription();
  }

  #calcSpeed() {
    this.speed = this.distance / (this.duration / 60); // km/h
    return this.speed;
  }
}
