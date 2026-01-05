
import React from 'react';
import { EnergyType } from './types';
import { Sun, Droplets, Wind, Flame, Zap, Fuel } from 'lucide-react';

// Ordem das faces para o gerador aleatório
export const ENERGY_FACES: EnergyType[] = ['Solar', 'Hidro', 'Eólica', 'Carvão', 'Gás', 'Petróleo'];

export const CLEAN_ENERGIES: EnergyType[] = ['Solar', 'Hidro', 'Eólica'];
export const FOSSIL_ENERGIES: EnergyType[] = ['Carvão', 'Gás', 'Petróleo'];

/**
 * MAPEAMENTO DE ROTAÇÃO PARA O CUBO CSS:
 * Front: x: 0, y: 0
 * Back: x: 0, y: 180
 * Right: x: 0, y: -90
 * Left: x: 0, y: 90
 * Top: x: -90, y: 0
 * Bottom: x: 90, y: 0
 */
export const ENERGY_CONFIG: Record<EnergyType, { 
  color: string, 
  icon: React.ReactNode, 
  points: number,
  rotation: { x: number, y: number } 
}> = {
  'Solar': { 
    color: 'bg-amber-400', 
    icon: <Sun size={24} />, 
    points: 15,
    rotation: { x: 0, y: 0 } // Front
  },
  'Carvão': { 
    color: 'bg-stone-800', 
    icon: <Flame size={24} className="text-orange-600" />, 
    points: -20,
    rotation: { x: 0, y: 180 } // Back
  },
  'Hidro': { 
    color: 'bg-cyan-500', 
    icon: <Droplets size={24} />, 
    points: 15,
    rotation: { x: 0, y: -90 } // Right (seen from front)
  },
  'Petróleo': { 
    color: 'bg-zinc-900', 
    icon: <Fuel size={24} className="text-amber-600" />, 
    points: -20,
    rotation: { x: 0, y: 90 } // Left (seen from front)
  },
  'Gás': { 
    color: 'bg-orange-600', 
    icon: <Zap size={24} />, 
    points: -20,
    rotation: { x: -90, y: 0 } // Top
  },
  'Eólica': { 
    color: 'bg-sky-400', 
    icon: <Wind size={24} />, 
    points: 15,
    rotation: { x: 90, y: 0 } // Bottom
  }
};

export const MAX_ROLLS = 3;
export const DICE_COUNT = 6;
