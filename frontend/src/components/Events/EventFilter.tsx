import React from 'react';
import {
  Box,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
  useTheme,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Divider,
  Button,
  Autocomplete,
  IconButton,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import RemovableChip from '../Shared/RemovableChip';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

interface Event {
  event_type: string;
  game_system?: string;
  start_time: string; // ISO string or time string
  gaming_group: string;
  location: {
    name: string;
  };
  minimum_age: string;
  experience_required: string;
}

interface Filters {
  eventTypes: string[];
  gameSystems: string[];
  days: string[];
  groups: string[];
  locations: string[];
  startTimes: string[];
  ageRequirements: string[];
  experienceLevels: string[];
}

// In EventFilter.tsx
interface EventFilterProps {
  events: Event[];
  filters: Filters;
  onFilterChange: (updatedFilters: Filters) => void;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name: string, selectedNames: readonly string[], theme: any): { fontWeight: number } {
  return {
    fontWeight:
      selectedNames.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const EventFilter = ({ events, filters, onFilterChange }: EventFilterProps) => {
  const theme = useTheme();

  // Extract unique values for each filter category from events prop
const useUniqueValues = <T,>(
  keyExtractor: (event: Event) => T | undefined | null,
  formatter?: (value: T) => string
) => {
  const ref = React.useRef<string[]>([]);

  React.useEffect(() => {
    const newValues = Array.from(
      new Set(events.map(keyExtractor).filter(Boolean).map(v => formatter ? formatter(v as T) : (v as string)))
    );
    ref.current = Array.from(new Set([...ref.current, ...newValues]));
  }, [events]);

  return ref;
};

// Usage:
const allEventTypes = useUniqueValues(e => e.event_type);
const allGameSystems = useUniqueValues(e => e.game_system);
const allDays = useUniqueValues(e => new Date(e.start_time), (date) =>
  date.toLocaleDateString(undefined, { weekday: 'long' })
);
const allGroups = useUniqueValues(e => e.gaming_group);
const allLocations = useUniqueValues(e => e.location?.name);

const ageRequirements: string[] = ['Kids','Everyone', 'Teen', 'Mature', '21+'];
const experienceLevels: string[] = ['None', 'Some', 'Expert'];

  const {
    eventTypes: selectedEventTypes,
    gameSystems: selectedGameSystems,
    days: selectedDays,
    groups: selectedGroups,
    locations: selectedLocations,
    startTimes: selectedStartTimes,
    ageRequirements: selectedAgeRequirements,
    experienceLevels: selectedExperienceLevels,
  } = filters;

  // Start Time multiselect state and data
  const startTimes: string[] = Array.from({ length: 24 }, (_, i) =>
    new Date(0, 0, 0, i).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const handleChangeStartTimes = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFilterChange({ ...filters, startTimes: value });
  };

  const handleChangeEventTypes = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFilterChange({ ...filters, eventTypes: value });
  };

  const handleChangeGameSystems = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFilterChange({ ...filters, gameSystems: value });
  };

  const handleChangeDays = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFilterChange({ ...filters, days: value });
  };

  const handleChangeGroups = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFilterChange({ ...filters, groups: value });
  };

  const handleChangeLocations = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    onFilterChange({ ...filters, locations: value });
  };

  const handleRemoveLocation = (locationToRemove: string) => {
    onFilterChange({ ...filters, locations: filters.locations.filter((loc) => loc !== locationToRemove) });
  };

  const handleRemoveEventType = (typeToRemove: string) => {
    onFilterChange({ ...filters, eventTypes: filters.eventTypes.filter(type => type !== typeToRemove) });
  };

  const handleRemoveGameSystem = (systemToRemove: string) => {
    onFilterChange({ ...filters, gameSystems: filters.gameSystems.filter(system => system !== systemToRemove) });
  };

  const handleRemoveDay = (dayToRemove: string) => {
    onFilterChange({ ...filters, days: filters.days.filter(day => day !== dayToRemove) });
  };

  const handleRemoveGroup = (groupToRemove: string) => {
    onFilterChange({ ...filters, groups: filters.groups.filter(group => group !== groupToRemove) });
  };

  const handleRemoveStartTime = (timeToRemove: string) => {
    onFilterChange({ ...filters, startTimes: filters.startTimes.filter(time => time !== timeToRemove) });
  };

  return (
    <Box sx={{ padding: 2, display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
      {/* Left side: Filter Events + all dropdowns */}
      <Box sx={{ flex: 2, pr: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Filter Events
        </Typography>
        <Box sx={{ mb: 2 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="event-type-label">Event Type</InputLabel>
              <Select
                labelId="event-type-label"
                multiple
                value={selectedEventTypes}
                onChange={handleChangeEventTypes}
                input={
                  <OutlinedInput
                    label="Event Type"
                    endAdornment={
                      selectedEventTypes.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                        <CancelOutlinedIcon
                          fontSize="small"
                          sx={{ cursor: 'pointer', mr: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChangeEventTypes({
                              target: { value: [] },
                            } as unknown as SelectChangeEvent<string[]>);
                          }}
                        />
                        </Box>
                      )
                    }
                  />
                }
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value: string) => (
                      <RemovableChip
                        key={value}
                        label={value}
                        onDelete={() =>
                          handleChangeEventTypes({
                            target: {
                              value: selectedEventTypes.filter((v) => v !== value),
                            },
                          } as unknown as SelectChangeEvent<string[]>)
                        }
                      />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {allEventTypes.current
                  .filter((type) => !selectedEventTypes.includes(type))
                  .map((type) => (
                    <MenuItem
                      key={type}
                      value={type}
                      style={getStyles(type, selectedEventTypes, theme)}
                    >
                      {type}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
<Box sx={{ mb: 2 }}>
  <FormControl fullWidth variant="outlined">
    <InputLabel id="game-system-label">Game System</InputLabel>
    <Select
      labelId="game-system-label"
      multiple
      value={selectedGameSystems}
      onChange={handleChangeGameSystems}
      input={
        <OutlinedInput
          label="Game System"
          endAdornment={
            selectedGameSystems.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
              <CancelOutlinedIcon
                fontSize="small"
                sx={{ cursor: 'pointer', mr: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeGameSystems({
                    target: { value: [] },
                  } as unknown as SelectChangeEvent<string[]>);
                }}
              />
              </Box>
            )
          }
        />
      }
      renderValue={(selected) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map((value: string) => (
            <RemovableChip
              key={value}
              label={value}
              onDelete={() =>
                handleChangeGameSystems({
                  target: {
                    value: selectedGameSystems.filter((v) => v !== value),
                  },
                } as unknown as SelectChangeEvent<string[]>)
              }
            />
          ))}
        </Box>
      )}
      MenuProps={MenuProps}
    >
      {allGameSystems.current
        .filter((system) => !selectedGameSystems.includes(system))
        .map((system) => (
          <MenuItem
            key={system}
            value={system}
            style={getStyles(system, selectedGameSystems, theme)}
          >
            {system}
          </MenuItem>
        ))}
    </Select>
  </FormControl>
</Box>

<Box sx={{ mb: 2 }}>
  <FormControl fullWidth variant="outlined">
    <InputLabel id="day-label">Day</InputLabel>
    <Select
      labelId="day-label"
      multiple
      value={selectedDays}
      onChange={handleChangeDays}
      input={
        <OutlinedInput
          label="Day"
          endAdornment={
            selectedDays.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
              <CancelOutlinedIcon
                fontSize="small"
                sx={{ cursor: 'pointer', mr: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeDays({
                    target: { value: [] },
                  } as unknown as SelectChangeEvent<string[]>);
                }}
              />
              </Box>
            )
          }
        />
      }
      renderValue={(selected) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map((value: string) => (
            <RemovableChip
              key={value}
              label={value}
              onDelete={() =>
                handleChangeDays({
                  target: {
                    value: selectedDays.filter((v) => v !== value),
                  },
                } as unknown as SelectChangeEvent<string[]>)
              }
            />
          ))}
        </Box>
      )}
      MenuProps={MenuProps}
    >
      {allDays.current
        .filter((day) => !selectedDays.includes(day))
        .map((day) => (
          <MenuItem
            key={day}
            value={day}
            style={getStyles(day, selectedDays, theme)}
          >
            {day}
          </MenuItem>
        ))}
    </Select>
  </FormControl>
</Box>

        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="start-time-label">Start Time</InputLabel>
            <Select
              labelId="start-time-label"
              multiple
              value={selectedStartTimes}
              onChange={handleChangeStartTimes}
              input={
                <OutlinedInput
                  label="Start Time"
                  endAdornment={
                    selectedStartTimes.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                        <CancelOutlinedIcon
                          fontSize="small"
                          sx={{ cursor: 'pointer', mr: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChangeStartTimes({
                              target: { value: [] },
                            } as unknown as SelectChangeEvent<string[]>);
                          }}
                        />
                      </Box>
                    )
                  }
                />
              }
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value: string) => (
                    <RemovableChip
                      key={value}
                      label={value}
                      onDelete={() =>
                        handleChangeStartTimes({
                          target: {
                            value: selectedStartTimes.filter((v) => v !== value),
                          },
                        } as unknown as SelectChangeEvent<string[]>)
                      }
                    />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {startTimes
                .filter((time) => !selectedStartTimes.includes(time))
                .map((time) => (
                  <MenuItem
                    key={time}
                    value={time}
                    style={getStyles(time, selectedStartTimes, theme)}
                  >
                    {time}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>
        
{/* Group */}
<Box sx={{ mb: 2 }}>
  <FormControl fullWidth variant="outlined">
    <InputLabel id="group-label">Group</InputLabel>
    <Select
      labelId="group-label"
      multiple
      value={selectedGroups}
      onChange={handleChangeGroups}
      input={
        <OutlinedInput
          label="Group"
          endAdornment={
            selectedGroups.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
              <CancelOutlinedIcon
                fontSize="small"
                sx={{ cursor: 'pointer', mr: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeGroups({
                    target: { value: [] },
                  } as unknown as SelectChangeEvent<string[]>);
                }}
              />
              </Box>
            )
          }
        />
      }
      renderValue={(selected) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map((value) => (
            <RemovableChip
              key={value}
              label={value}
              onDelete={() =>
                handleChangeGroups({
                  target: {
                    value: selectedGroups.filter((v) => v !== value),
                  },
                } as unknown as SelectChangeEvent<string[]>)
              }
            />
          ))}
        </Box>
      )}
      MenuProps={MenuProps}
    >
      {allGroups.current
        .filter((group) => !selectedGroups.includes(group))
        .map((group) => (
          <MenuItem key={group} value={group}>
            {group}
          </MenuItem>
        ))}
    </Select>
  </FormControl>
</Box>

{/* Location */}
<Box sx={{ mb: 2 }}>
  <FormControl fullWidth variant="outlined">
    <InputLabel id="location-label">Location</InputLabel>
    <Select
      labelId="location-label"
      multiple
      value={selectedLocations}
      onChange={handleChangeLocations}
      input={
        <OutlinedInput
          label="Location"
          endAdornment={
            selectedLocations.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
              <CancelOutlinedIcon
                fontSize="small"
                sx={{ cursor: 'pointer', mr: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeLocations({
                    target: { value: [] },
                  } as unknown as SelectChangeEvent<string[]>);
                }}
              />
              </Box>
            )
          }
        />
      }
      renderValue={(selected) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map((value) => (
            <RemovableChip
              key={value}
              label={value}
              onDelete={() =>
                handleChangeLocations({
                  target: {
                    value: selectedLocations.filter((v) => v !== value),
                  },
                } as unknown as SelectChangeEvent<string[]>)
              }
            />
          ))}
        </Box>
      )}
      MenuProps={MenuProps}
    >
      {allLocations.current
        .filter((loc) => !selectedLocations.includes(loc))
        .map((loc) => (
          <MenuItem key={loc} value={loc}>
            {loc}
          </MenuItem>
        ))}
    </Select>
  </FormControl>
</Box>
      </Box>
      {/* Right side: Clear All Filters button, Age Requirements and Experience Level with Divider between */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => {
            onFilterChange({
              eventTypes: [],
              gameSystems: [],
              days: [],
              groups: [],
              locations: [],
              startTimes: [],
              ageRequirements: [],
              experienceLevels: [],
            });
          }}
        >
          Clear All Filters
        </Button>
        <Box>
          <Typography variant="subtitle1">Age Requirements</Typography>
          <FormGroup>
            {ageRequirements.map((age: string) => (
              <FormControlLabel 
                key={age} 
                control={
                  <Checkbox 
                    checked={selectedAgeRequirements.includes(age)} 
                    onChange={() =>
                      onFilterChange({
                        ...filters,
                        ageRequirements: selectedAgeRequirements.includes(age)
                          ? selectedAgeRequirements.filter((a) => a !== age)
                          : [...selectedAgeRequirements, age],
                      })
                    }
                  />
                } 
                label={age} 
              />
            ))}
          </FormGroup>
        </Box>
        {/* Divider between Age Requirements and Experience Level */}
        <Divider orientation="horizontal" flexItem sx={{ my: 2 }} />
        <Box>
          <Typography variant="subtitle1">Experience Level</Typography>
          <FormGroup>
            {experienceLevels.map((level: string) => (
              <FormControlLabel 
                key={level} 
                control={
                  <Checkbox 
                    checked={selectedExperienceLevels.includes(level)} 
                    onChange={() =>
                      onFilterChange({
                        ...filters,
                        experienceLevels: selectedExperienceLevels.includes(level)
                          ? selectedExperienceLevels.filter((l) => l !== level)
                          : [...selectedExperienceLevels, level],
                      })
                    }
                  />
                } 
                label={level} 
              />
            ))}
          </FormGroup>
        </Box>
      </Box>
    </Box>
  );
};

export default EventFilter;
