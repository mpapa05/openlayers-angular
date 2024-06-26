import { RouterOutlet } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
// import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';

import Draw, {
  createBox,
  createRegularPolygon,
} from 'ol/interaction/Draw.js';
import Polygon from 'ol/geom/Polygon.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  map: Map | undefined;
  source: VectorSource = new VectorSource({ wrapX: false });
  selectedShape: 'Circle' | 'Square' | 'Box' | 'Circle' | 'Star' | 'None' = 'None';
  draw: Draw | null = null;

  ngOnInit(): void {
    const raster = new TileLayer({
      source: new OSM(),
    });

    const vector = new VectorLayer({
      source: this.source,
    });

    this.map = new Map({
      layers: [raster, vector],
      target: 'ol-map',
      view: new View({
        center: [-11000000, 4600000],
        zoom: 4,
      }),
    });

    this.addInteraction();
  }

  onShapeSelect(eventValue: 'Circle' | 'Square' | 'Box' | 'Circle' | 'Star' | 'None'): void {
    this.selectedShape = eventValue;
    this.addInteraction();
  }

  addInteraction(): void {
    if (this.draw && this.map) {
      this.map.removeInteraction(this.draw);
    }

    if (this.selectedShape !== 'None') {
      let geometryFunction;
      let value = this.selectedShape;

      if (value === 'Square') {
        value = 'Circle';
        geometryFunction = createRegularPolygon(4);
      } else if (value === 'Box') {
        value = 'Circle';
        geometryFunction = createBox();
      } else if (value === 'Star') {
        value = 'Circle';
        geometryFunction = this.createStarGeometry;
      }

      this.draw = new Draw({
        source: this.source,
        type: value,
        geometryFunction: geometryFunction,
      });
      this.map ? this.map.addInteraction(this.draw) : null;
      
    }
  }

  createStarGeometry = (coordinates: any, geometry?: any) => {
    const center = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    const dx = center[0] - last[0];
    const dy = center[1] - last[1];
    const radius = Math.sqrt(dx * dx + dy * dy);
    const rotation = Math.atan2(dy, dx);
    const newCoordinates = [];
    const numPoints = 12;

    for (let i = 0; i < numPoints; ++i) {
      const angle = rotation + (i * 2 * Math.PI) / numPoints;
      const fraction = i % 2 === 0 ? 1 : 0.5;
      const offsetX = radius * fraction * Math.cos(angle);
      const offsetY = radius * fraction * Math.sin(angle);
      newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
    }
    newCoordinates.push(newCoordinates[0].slice());

    if (!geometry) {
      geometry = new Polygon([newCoordinates]);
    } else {
      geometry.setCoordinates([newCoordinates]);
    }
    return geometry;
  };
}
