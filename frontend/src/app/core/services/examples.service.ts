import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DimensionMapping, MusicalScale } from '../models/composition.model';

export interface ExampleDataset {
  slug: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
  filename: string;
  suggestedBpm: number;
  suggestedScale: MusicalScale;
  suggestedMappings: DimensionMapping[];
}

@Injectable({ providedIn: 'root' })
export class ExamplesService {
  private readonly http = inject(HttpClient);

  readonly examples: ExampleDataset[] = [
    {
      slug: 'stock-trend',
      name: 'Stock prices',
      description: '60 days of a stock\'s rise, dip, and rally.',
      icon: '$',
      accent: 'from-emerald-500 to-teal-500',
      filename: 'stock-trend.csv',
      suggestedBpm: 100,
      suggestedScale: 'BLUES',
      suggestedMappings: [
        { dimension: 'PITCH', columnName: 'price' },
        { dimension: 'VELOCITY', columnName: 'volume' }
      ]
    },
    {
      slug: 'weather-week',
      name: 'World weather',
      description: 'A week of temperature & humidity across four cities.',
      icon: '☁',
      accent: 'from-sky-500 to-cyan-500',
      filename: 'weather-week.csv',
      suggestedBpm: 90,
      suggestedScale: 'PENTATONIC',
      suggestedMappings: [
        { dimension: 'PITCH', columnName: 'temperature' },
        { dimension: 'VELOCITY', columnName: 'humidity' },
        { dimension: 'INSTRUMENT', columnName: 'city' }
      ]
    },
    {
      slug: 'pokemon-stats',
      name: 'Pokémon stats',
      description: '20 famous Pokémon with their HP, attack, defense, speed.',
      icon: '⚡',
      accent: 'from-yellow-500 to-orange-500',
      filename: 'pokemon-stats.csv',
      suggestedBpm: 130,
      suggestedScale: 'A_MINOR',
      suggestedMappings: [
        { dimension: 'PITCH', columnName: 'speed' },
        { dimension: 'VELOCITY', columnName: 'attack' },
        { dimension: 'INSTRUMENT', columnName: 'type' }
      ]
    },
    {
      slug: 'heart-rate',
      name: 'Workout heart rate',
      description: '30 minutes of HR climbing through training zones.',
      icon: '♥',
      accent: 'from-rose-500 to-pink-500',
      filename: 'heart-rate.csv',
      suggestedBpm: 120,
      suggestedScale: 'PENTATONIC',
      suggestedMappings: [
        { dimension: 'PITCH', columnName: 'heart_rate' },
        { dimension: 'DURATION', columnName: 'pace' },
        { dimension: 'INSTRUMENT', columnName: 'zone' }
      ]
    }
  ];

  async fetchAsFile(example: ExampleDataset): Promise<File> {
    const url = `/examples/${example.filename}`;
    const text = await firstValueFrom(
      this.http.get(url, { responseType: 'text' })
    );
    return new File([text], example.filename, { type: 'text/csv' });
  }
}
