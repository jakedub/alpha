import React from 'react';
import {
  Box,
  TextField,

  Typography,
  useTheme,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Divider,
  Autocomplete,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import RemovableChip from '../Shared/RemovableChip';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Vendor } from '../../models/vendors';
import { TAG_NAMES, TAG_DISPLAY_NAMES, TAG_DISPLAY_NAMES_EXTENDED } from '../../models/tags';

// If Tag is a string union or interface, import or define it here.
// Example assuming Tag is a string:
type Tag = string;

interface VendorFilterProps {
  vendors: Vendor[];
  tags: Tag[];
  selectedVendors: Vendor[];
  setSelectedVendors: (vendors: Vendor[]) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTags: string[];
  onTagChange: (tags: string[]) => void;
  onSearchChange?: (term: string) => void;
  onVendorChange?: (vendors: Vendor[]) => void;
  onClearFilters?: () => void;
  onClearSearch?: () => void;
  onClearSelectedVendors?: () => void;
  onClearSelectedTags?: () => void;
  onClearAll?: () => void;
  onApplyFilters?: () => void;
  onApplySearch?: () => void;
  onApplySelectedVendors?: () => void;
  onApplySelectedTags?: () => void;
  onApplyAll?: () => void;
  onChange?: (event: SelectChangeEvent<string[]>) => void;

}

{TAG_NAMES.map((tag) => (
  <MenuItem key={tag} value={tag}>
    {TAG_DISPLAY_NAMES[tag as keyof typeof TAG_DISPLAY_NAMES] ?? tag}
  </MenuItem>
))}

const VendorFilter: React.FC<VendorFilterProps> = ({
  vendors,
  selectedVendors,
  setSelectedVendors,
  searchTerm,
  setSearchTerm,
  selectedTags,
  onTagChange,
}) => {
  const theme = useTheme();

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVendorChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setSelectedVendors(vendors.filter((vendor) => value.includes(vendor.gencon_id)));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <><Box sx={{
      height: '100%',
      width: '100%',
      backgroundColor: theme.palette.background.paper,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'stretch',
      gap: 2,
      padding: 2,
      boxSizing: 'border-box',
    }}>
          <Typography variant="h6" gutterBottom>
              Filter Vendors
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Autocomplete
                multiple
                options={vendors}
                getOptionLabel={(option) => option.name}
                value={selectedVendors}
                onChange={(_, newValue) => setSelectedVendors(newValue)}
                renderTags={(value: Vendor[], getTagProps) => value.map((option, index) => (
                  <Chip
                    label={option.name}
                    {...getTagProps({ index })}
                    key={option.gencon_id} />
                ))}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Search and Select Vendors"
                    placeholder="Start typing vendor name"
                    fullWidth />
                )}
                isOptionEqualToValue={(option, value) => option.gencon_id === value.gencon_id}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Autocomplete
                multiple
                options={[...TAG_NAMES, 'no_tag']}
                getOptionLabel={(tag) =>
                  TAG_DISPLAY_NAMES_EXTENDED[tag as keyof typeof TAG_DISPLAY_NAMES_EXTENDED] ?? tag
                }
                value={selectedTags}
                onChange={(_, newValue) => onTagChange(newValue)}
                renderTags={(value: string[], getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={TAG_DISPLAY_NAMES_EXTENDED[option as keyof typeof TAG_DISPLAY_NAMES_EXTENDED] ?? option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Filter by Tags"
                    placeholder="Start typing tag"
                    fullWidth />
                )}
                isOptionEqualToValue={(option, value) => option === value}
              />
            </Box>
          </Box>
      </Box></>
  );
};

export default VendorFilter;