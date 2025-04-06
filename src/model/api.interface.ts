import {foodInterface} from './food.interface';

export interface apiFormat {
  limit : number,
  recipes: foodInterface[],
  skip: number,
  total: number
}
