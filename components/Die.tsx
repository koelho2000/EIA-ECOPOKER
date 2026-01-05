
import React from 'react';
import { EnergyType } from '../types';
import { ENERGY_CONFIG } from '../constants';

interface DieProps {
  value: EnergyType | null;
  held: boolean;
  onHoldToggle: () => void;
  rolling: boolean;
  index: number;
}

const Die: React.FC<DieProps> = ({ value, held, onHoldToggle, rolling, index }) => {
  const [rotation, setRotation] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (rolling && !held) {
      const extraX = (Math.floor(Math.random() * 4) + 2) * 360;
      const extraY = (Math.floor(Math.random() * 4) + 2) * 360;
      setRotation({ x: extraX, y: extraY });
    } else if (value) {
      const base = ENERGY_CONFIG[value].rotation;
      setRotation(prev => ({
        x: Math.round(prev.x / 360) * 360 + base.x,
        y: Math.round(prev.y / 360) * 360 + base.y
      }));
    }
  }, [rolling, value, held]);

  // Mapeamento rigoroso: cada face física do cubo recebe um tipo de energia
  // As coordenadas de rotação no constants.tsx devem apontar para estas faces
  const faces = [
    { type: 'front', rotation: 'rotateY(0deg) translateZ(40px)', energy: 'Solar' },
    { type: 'back', rotation: 'rotateY(180deg) translateZ(40px)', energy: 'Carvão' },
    { type: 'right', rotation: 'rotateY(90deg) translateZ(40px)', energy: 'Hidro' },
    { type: 'left', rotation: 'rotateY(-90deg) translateZ(40px)', energy: 'Petróleo' },
    { type: 'top', rotation: 'rotateX(90deg) translateZ(40px)', energy: 'Gás' },
    { type: 'bottom', rotation: 'rotateX(-90deg) translateZ(40px)', energy: 'Eólica' }
  ];

  return (
    <div 
      className={`perspective-1000 w-20 h-20 cursor-pointer touch-none select-none transition-all duration-300 ${held ? 'opacity-80 scale-90' : 'scale-100'}`}
      onClick={onHoldToggle}
    >
      <div 
        className="relative w-full h-full preserve-3d transition-transform duration-1000 ease-out"
        style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
      >
        {faces.map((face, i) => {
          const energy = face.energy as EnergyType;
          const config = ENERGY_CONFIG[energy];
          return (
            <div
              key={i}
              className={`absolute w-full h-full flex items-center justify-center rounded-xl border-2 border-white/20 text-white backface-hidden shadow-lg ${config.color}`}
              style={{ transform: face.rotation }}
            >
              <div className="flex flex-col items-center">
                {config.icon}
                <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{energy}</span>
              </div>
            </div>
          );
        })}
      </div>
      {held && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg z-10 animate-bounce-subtle border border-white">
          OK
        </div>
      )}
    </div>
  );
};

export default Die;
