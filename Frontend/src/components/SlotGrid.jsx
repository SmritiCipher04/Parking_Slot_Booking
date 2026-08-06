import React from 'react';

const formatTimeLabel = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

const SlotGrid = ({ slots, selectedSlotId, onSelectSlot }) => {
  return (
    <div className="slot-grid" id="slot-grid">
      {slots.map((slot) => {
        const sId = slot.slotNumber || slot.slotId || slot.id;
        const status = slot.status || 'available';
        const isSelected = selectedSlotId === sId;

        const isOccupied = status === 'booked' || status === 'occupied';
        const isClickable = status === 'available';
        const statusClasses = isOccupied ? 'occupied booked' : status;

        const untilFormatted = slot.occupiedUntil ? formatTimeLabel(slot.occupiedUntil) : '';
        const tooltipText = isOccupied
          ? `Occupied ${untilFormatted ? `until ${untilFormatted}` : 'for active booking'}`
          : status === 'reserved'
          ? 'Reserved Slot'
          : 'Available for booking';

        let statusSubtext = 'Available';
        if (isOccupied) {
          statusSubtext = untilFormatted ? `Until ${untilFormatted}` : 'Occupied';
        } else if (status === 'reserved') {
          statusSubtext = 'Reserved';
        }

        return (
          <div
            key={sId}
            className={`slot ${statusClasses} ${isSelected ? 'selected' : ''}`}
            title={tooltipText}
            onClick={() => {
              if (isClickable) {
                onSelectSlot(sId);
              }
            }}
          >
            <div>{sId}</div>
            <div className="slot-subtext">{statusSubtext}</div>
          </div>
        );
      })}
    </div>
  );
};

export default SlotGrid;
