import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import api from '../../api/api';
import type { Filters } from '../../types/filters';

interface Event {
  event_type: string;
  game_system?: string;
  start_time: string;
  gaming_group: string;
  location: { name: string };
  minimum_age: string;
  experience_required: string;
}

interface EventFilterProps {
  events: Event[];
  filters: Filters;
  onFilterChange: (updatedFilters: Filters) => void;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 240 },
  },
};

export const AGE_REQUIREMENTS = ['Kids', 'Everyone', 'Teen', 'Mature', '21+'];
export const EXPERIENCE_LEVELS = ['None', 'Some', 'Expert'];

// Default state — age and experience are fully checked (no restriction).
// "Clear all" resets to this, not to empty arrays.
export const DEFAULT_FILTERS: Filters = {
  search: '',
  gameId: '',
  eventTypes: [],
  gameSystems: [],
  days: [],
  groups: [],
  locations: [],
  startTimes: [],
  ageRequirements: [...AGE_REQUIREMENTS],
  experienceLevels: [...EXPERIENCE_LEVELS],
};

// ── Reusable multi-select dropdown ──────────────────────────────────────────
function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const labelId = `${label.toLowerCase().replace(/\s+/g, '-')}-label`;
  return (
    <FormControl fullWidth size="small" variant="outlined">
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        multiple
        value={selected}
        onChange={(e: SelectChangeEvent<string[]>) =>
          onChange(e.target.value as string[])
        }
        input={
          <OutlinedInput
            label={label}
            endAdornment={
              selected.length > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                  <IconButton
                    size="small"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onChange([]); }}
                  >
                    <CancelOutlinedIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : null
            }
          />
        }
        renderValue={(sel) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(sel as string[]).map((v) => (
              <Chip
                key={v}
                label={v}
                size="small"
                color="primary"
                onDelete={() => onChange(selected.filter((s) => s !== v))}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {options
          .filter((o) => !selected.includes(o))
          .map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
const EventFilter = ({ events, filters, onFilterChange }: EventFilterProps) => {
  const theme = useTheme();

  // ── All distinct groups + game systems from backend ──────────────────────
  const [allGroups, setAllGroups] = React.useState<string[]>([]);
  const [allGameSystems, setAllGameSystems] = React.useState<string[]>([]);

  React.useEffect(() => {
    api.get('/events/distinct-values/')
      .then((res) => {
        setAllGroups(res.data.gaming_groups ?? []);
        setAllGameSystems(res.data.game_systems ?? []);
      })
      .catch(() => {/* silently fall back to page-accumulated values */});
  }, []);

  // Accumulate unique values from current page (fallback + dynamic filters)
  const useUniqueValues = <T,>(
    keyExtractor: (event: Event) => T | undefined | null,
    formatter?: (value: T) => string,
  ) => {
    const ref = React.useRef<string[]>([]);
    React.useEffect(() => {
      const newValues = Array.from(
        new Set(
          events
            .map(keyExtractor)
            .filter(Boolean)
            .map((v) => (formatter ? formatter(v as T) : (v as string))),
        ),
      );
      ref.current = Array.from(new Set([...ref.current, ...newValues]));
    }, [events]);
    return ref;
  };

  const allEventTypes = useUniqueValues((e) => e.event_type);
  const allDays = useUniqueValues(
    (e) => new Date(e.start_time),
    (date) => date.toLocaleDateString(undefined, { weekday: 'long' }),
  );
  const allLocations = useUniqueValues((e) => e.location?.name);

  const startTimes: string[] = Array.from({ length: 24 }, (_, i) =>
    new Date(0, 0, 0, i).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );

  // Active filter count — age/experience only count when narrowed from default
  const activeCount =
    (filters.search ? 1 : 0) +
    (filters.gameId ? 1 : 0) +
    filters.eventTypes.length +
    filters.gameSystems.length +
    filters.days.length +
    filters.groups.length +
    filters.locations.length +
    filters.startTimes.length +
    (filters.ageRequirements.length < AGE_REQUIREMENTS.length ? 1 : 0) +
    (filters.experienceLevels.length < EXPERIENCE_LEVELS.length ? 1 : 0);

  return (
    <Box
      sx={{
        width: 280,
        flexShrink: 0,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignSelf: 'flex-start',
        position: 'sticky',
        top: 80,
        maxHeight: 'calc(100vh - 96px)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <FilterListIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="subtitle2" fontWeight={600}>
            Filters
          </Typography>
          {activeCount > 0 && (
            <Chip
              label={activeCount}
              size="small"
              color="primary"
              sx={{ height: 18, fontSize: '0.7rem' }}
            />
          )}
        </Box>
        {activeCount > 0 && (
          <Button
            size="small"
            variant="text"
            onClick={() => onFilterChange(DEFAULT_FILTERS)}
            sx={{ fontSize: '0.75rem', px: 1, color: 'text.secondary' }}
          >
            Clear all
          </Button>
        )}
      </Box>

      <Divider />

      {/* ── Text search ──────────────────────────────────────────────────── */}
      <TextField
        size="small"
        label="Search"
        placeholder="Title, group, game system…"
        value={filters.search}
        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        InputProps={{
          endAdornment: filters.search ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onFilterChange({ ...filters, search: '' })}>
                <CancelOutlinedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      {/* ── Event ID ─────────────────────────────────────────────────────── */}
      <TextField
        size="small"
        label="Event ID"
        placeholder="e.g. BGM26ND306431"
        value={filters.gameId}
        onChange={(e) => onFilterChange({ ...filters, gameId: e.target.value.trim() })}
        InputProps={{
          endAdornment: filters.gameId ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onFilterChange({ ...filters, gameId: '' })}>
                <CancelOutlinedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      <Divider />

      {/* Dropdowns */}
      <MultiSelect
        label="Event Type"
        options={[...allEventTypes.current].sort((a, b) => a.localeCompare(b))}
        selected={filters.eventTypes}
        onChange={(val) => onFilterChange({ ...filters, eventTypes: val })}
      />
      <MultiSelect
        label="Game System"
        options={allGameSystems}
        selected={filters.gameSystems}
        onChange={(val) => onFilterChange({ ...filters, gameSystems: val })}
      />
      <MultiSelect
        label="Day"
        options={allDays.current}
        selected={filters.days}
        onChange={(val) => onFilterChange({ ...filters, days: val })}
      />
      <MultiSelect
        label="Start Time"
        options={startTimes}
        selected={filters.startTimes}
        onChange={(val) => onFilterChange({ ...filters, startTimes: val })}
      />
      <MultiSelect
        label="Group"
        options={allGroups}
        selected={filters.groups}
        onChange={(val) => onFilterChange({ ...filters, groups: val })}
      />
      <MultiSelect
        label="Location"
        options={allLocations.current}
        selected={filters.locations}
        onChange={(val) => onFilterChange({ ...filters, locations: val })}
      />

      <Divider />

      {/* Age Requirements */}
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Age
        </Typography>
        <FormGroup sx={{ mt: 0.5 }}>
          {AGE_REQUIREMENTS.map((age) => (
            <FormControlLabel
              key={age}
              control={
                <Checkbox
                  size="small"
                  checked={filters.ageRequirements.includes(age)}
                  onChange={() =>
                    onFilterChange({
                      ...filters,
                      ageRequirements: filters.ageRequirements.includes(age)
                        ? filters.ageRequirements.filter((a) => a !== age)
                        : [...filters.ageRequirements, age],
                    })
                  }
                />
              }
              label={<Typography variant="body2">{age}</Typography>}
            />
          ))}
        </FormGroup>
      </Box>

      <Divider />

      {/* Experience Level */}
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Experience
        </Typography>
        <FormGroup sx={{ mt: 0.5 }}>
          {EXPERIENCE_LEVELS.map((level) => (
            <FormControlLabel
              key={level}
              control={
                <Checkbox
                  size="small"
                  checked={filters.experienceLevels.includes(level)}
                  onChange={() =>
                    onFilterChange({
                      ...filters,
                      experienceLevels: filters.experienceLevels.includes(level)
                        ? filters.experienceLevels.filter((l) => l !== level)
                        : [...filters.experienceLevels, level],
                    })
                  }
                />
              }
              label={<Typography variant="body2">{level}</Typography>}
            />
          ))}
        </FormGroup>
      </Box>
    </Box>
  );
};

export default EventFilter;
