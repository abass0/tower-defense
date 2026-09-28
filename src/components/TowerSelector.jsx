/**
 * TowerSelector.jsx
 *
 * Bottom bar for picking a tower to place. Reads cost/name/color straight
 * from the tower config so balance changes never require touching this
 * component. Disables/greys out options the player can't currently
 * afford.
 */
import { TOWER_ORDER, TOWER_TYPES } from '../game/config/towers.js';

function colorToHex(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export default function TowerSelector({ money, activeType, onSelectType, onCancel }) {
  return (
    <div className="tower-selector">
      {TOWER_ORDER.map((type) => {
        const cfg = TOWER_TYPES[type];
        const affordable = money >= cfg.cost;
        const active = activeType === type;

        return (
          <button
            key={type}
            type="button"
            className={`tower-option${active ? ' active' : ''}${!affordable ? ' disabled' : ''}`}
            disabled={!affordable}
            onClick={() => onSelectType(type)}
            title={cfg.description}
          >
            <span className="tower-icon" style={{ background: colorToHex(cfg.color) }} />
            <span className="tower-option-info">
              <span className="tower-name">{cfg.name}</span>
              <span className="tower-cost">${cfg.cost}</span>
            </span>
          </button>
        );
      })}

      {activeType && (
        <button type="button" className="tower-cancel" onClick={onCancel}>
          Cancel (Esc)
        </button>
      )}
    </div>
  );
}
