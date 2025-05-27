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
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

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

function getStyles(name: string, selectedNames: readonly string[], theme: any) {
  return {
    fontWeight:
      selectedNames.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const EventFilter = ({ events }: { events: Event[] }) => {
  const theme = useTheme();

  // Extract unique values for each filter category from events prop
  const eventTypes = Array.from(new Set(events.map(event => event.event_type ?? ''))).filter(Boolean);
  const gameSystems = Array.from(new Set(events.map(event => event.game_system ?? ''))).filter(Boolean);
  const days = Array.from(new Set(events.map(event => {
    // Derive day from start_time
    const date = new Date(event.start_time);
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }))).filter(Boolean);
  const groups = Array.from(new Set(events.map(event => event.gaming_group ?? ''))).filter(Boolean);
  const locations = Array.from(new Set(events.map(event => event.location?.name ?? ''))).filter(Boolean);
  const ageRequirements = Array.from(new Set(events.map(event => event.minimum_age ?? ''))).filter(Boolean);
  const experienceLevels = Array.from(new Set(events.map(event => event.experience_required ?? ''))).filter(Boolean);

  // Debug output for ageRequirements and experienceLevels
  console.log('ageRequirements:', ageRequirements);
  console.log('experienceLevels:', experienceLevels);

  const [selectedEventTypes, setSelectedEventTypes] = React.useState<string[]>([]);
  const [selectedGameSystems, setSelectedGameSystems] = React.useState<string[]>([]);
  const [selectedDays, setSelectedDays] = React.useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = React.useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>([]);

  // Start Time multiselect state and data
  const startTimes = Array.from({ length: 24 }, (_, i) =>
    new Date(0, 0, 0, i).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [selectedStartTimes, setSelectedStartTimes] = React.useState<string[]>([]);
  const handleChangeStartTimes = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setSelectedStartTimes(value);
  };

  const handleChangeEventTypes = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setSelectedEventTypes(value);
  };

  const handleChangeGameSystems = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setSelectedGameSystems(value);
  };

  const handleChangeDays = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setSelectedDays(value);
  };

  const handleChangeGroups = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setSelectedGroups(value);
  };

  const handleChangeLocations = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setSelectedLocations(value);
  };

  return (
    <Box sx={{ padding: 2, display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
      {/* Left side: Filter Events + all dropdowns */}
      <Box sx={{ flex: 2, pr: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          Filter Events
        </Typography>
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="event-type-label">Event Type</InputLabel>
            <Select
              labelId="event-type-label"
              multiple
              value={selectedEventTypes}
              onChange={handleChangeEventTypes}
              input={<OutlinedInput label="Event Type" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {eventTypes.map((type) => (
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
          <FormControl fullWidth>
            <InputLabel id="game-system-label">Game System</InputLabel>
            <Select
              labelId="game-system-label"
              multiple
              value={selectedGameSystems}
              onChange={handleChangeGameSystems}
              input={<OutlinedInput label="Game System" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {gameSystems.map((system) => (
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
          <FormControl fullWidth>
            <InputLabel id="day-label">Day</InputLabel>
            <Select
              labelId="day-label"
              multiple
              value={selectedDays}
              onChange={handleChangeDays}
              input={<OutlinedInput label="Day" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {days.map((day) => (
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
          <FormControl fullWidth>
            <InputLabel id="start-time-label">Start Time</InputLabel>
            <Select
              labelId="start-time-label"
              multiple
              value={selectedStartTimes}
              onChange={handleChangeStartTimes}
              input={<OutlinedInput label="Start Time" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {startTimes.map((time) => (
                <MenuItem key={time} value={time} style={getStyles(time, selectedStartTimes, theme)}>
                  {time}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="group-label">Group</InputLabel>
            <Select
              labelId="group-label"
              multiple
              value={selectedGroups}
              onChange={handleChangeGroups}
              input={<OutlinedInput label="Group" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {groups.map((group) => (
                <MenuItem
                  key={group}
                  value={group}
                  style={getStyles(group, selectedGroups, theme)}
                >
                  {group}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="location-label">Location</InputLabel>
            <Select
              labelId="location-label"
              multiple
              value={selectedLocations}
              onChange={handleChangeLocations}
              input={<OutlinedInput label="Location" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {locations.map((loc) => (
                <MenuItem
                  key={loc}
                  value={loc}
                  style={getStyles(loc, selectedLocations, theme)}
                >
                  {loc}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      {/* Right side: Age Requirements and Experience Level with Divider between */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle1">Age Requirements</Typography>
          <FormGroup>
            {ageRequirements.map((age) => (
              <FormControlLabel key={age} control={<Checkbox />} label={age} />
            ))}
          </FormGroup>
        </Box>
        {/* Divider between Age Requirements and Experience Level */}
        <Divider orientation="horizontal" flexItem sx={{ my: 2 }} />
        <Box>
          <Typography variant="subtitle1">Experience Level</Typography>
          <FormGroup>
            {experienceLevels.map((level) => (
              <FormControlLabel key={level} control={<Checkbox />} label={level} />
            ))}
          </FormGroup>
        </Box>
      </Box>
    </Box>
  );
};

export default EventFilter;
