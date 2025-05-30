import React from 'react';
import { Chip } from '@mui/material';

interface RemovableChipProps {
  label: string;
  onDelete: () => void;
}

const RemovableChip: React.FC<RemovableChipProps> = ({ label, onDelete }) => {
  return (
    <span onMouseDown={(e) => e.stopPropagation()}>
      <Chip label={label} onDelete={onDelete} />
    </span>
  );
};

export default RemovableChip;