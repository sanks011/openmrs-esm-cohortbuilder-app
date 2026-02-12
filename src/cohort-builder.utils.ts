import { showToast } from '@openmrs/esm-framework';
import type { Column, Patient, Query } from './types';

export const composeJson = (searchParameters) => {
  const query: Query = {
    type: 'org.openmrs.module.reporting.dataset.definition.PatientDataSetDefinition',
    columns: [],
    rowFilters: [],
    customRowFilterCombination: '',
  };
  query.columns = addColumnsToDisplay();
  let counter = 0;
  query.rowFilters = [];
  for (const field in searchParameters) {
    if (isNullValues(searchParameters[field])) {
      delete searchParameters[field];
      continue;
    }
    if (searchParameters[field] != 'all' && searchParameters != '') {
      query.rowFilters[counter] = {};
      query.rowFilters[counter].key = getDefinitionLibraryKey(field, searchParameters[field]);
    }
    if (Array.isArray(searchParameters[field])) {
      query.rowFilters[counter].parameterValues = getParameterValues(searchParameters[field]);
    }
    if (searchParameters[field].length >= 1 && searchParameters[field][0].livingStatus === 'alive') {
      query.rowFilters[counter].livingStatus = 'alive';
    }
    query.rowFilters[counter].type = 'org.openmrs.module.reporting.dataset.definition.PatientDataSetDefinition';
    counter += 1;
  }
  query.customRowFilterCombination = composeFilterCombination(query.rowFilters);
  return { query };
};

export const isNullValues = (fieldValues) => {
  if (Array.isArray(fieldValues) && fieldValues.length >= 1) {
    return !fieldValues[0].value;
  }
  return fieldValues === 'all' || !fieldValues;
};

export const getDefinitionLibraryKey = (field: string, value: string) => {
  let definitionLibraryKey = 'reporting.library.cohortDefinition.builtIn';
  switch (field) {
    case 'gender':
      definitionLibraryKey += `.${value}`;
      break;
    default:
      definitionLibraryKey += `.${field}`;
  }
  return definitionLibraryKey;
};

export const getParameterValues = (parameterFields) => {
  const parameter = {};
  parameterFields.forEach((eachParam) => {
    parameter[eachParam.name] = eachParam.value;
  });
  return parameter;
};

export const composeFilterCombination = (filterColumns) => {
  let compositionTitle = '';
  const totalNumber = filterColumns.length;
  for (let index = 1; index <= totalNumber; index++) {
    if (filterColumns[index - 1].livingStatus === 'alive') {
      compositionTitle += `NOT ${index}`;
      delete filterColumns[index - 1].livingStatus;
    } else {
      compositionTitle += `${index}`;
    }
    compositionTitle += index < totalNumber ? ' AND ' : '';
  }
  return compositionTitle;
};

export const addColumnsToDisplay = () => {
  const columns = [
    {
      name: 'firstname',
      key: 'preferredName.givenName',
    },
    {
      name: 'lastname',
      key: 'preferredName.familyName',
    },
    {
      name: 'gender',
      key: 'gender',
    },
    {
      name: 'age',
      key: 'ageOnDate.fullYears',
    },
    {
      name: 'patientId',
      key: 'patientId',
    },
  ];

  const columnValues = columns.map((aColumn: Column) => {
    aColumn.type = 'org.openmrs.module.reporting.data.patient.definition.PatientDataDefinition';
    aColumn.key = `reporting.library.patientDataDefinition.builtIn.${aColumn.key}`;
    return aColumn;
  });
  return columnValues;
};

const STORAGE_KEY = 'openmrsHistory';
const MAX_HISTORY_ITEMS = 50; // LRU cache: Keep only most recent 50 searches
const MAX_PATIENTS_PER_SEARCH = 100; // Limit patient data to prevent storage bloat

/**
 * Safely adds search to history with comprehensive error handling
 * Implements LRU cache, quota management, and graceful degradation
 * @param description - Human-readable description of the search
 * @param patients - Array of patient results
 * @param parameters - Search parameters used
 * @returns boolean - true if successfully saved, false otherwise
 */
export const addToHistory = (description: string, patients: Patient[], parameters: {}): boolean => {
  try {
    // Validate inputs
    if (!Array.isArray(patients) || typeof parameters !== 'object') {
      return false;
    }

    // Limit patient data to prevent storage bloat
    const limitedPatients = patients.slice(0, MAX_PATIENTS_PER_SEARCH);

    // Safely retrieve existing history
    let oldHistory: any[] = [];
    const storedData = window.sessionStorage.getItem(STORAGE_KEY);

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        oldHistory = Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        // Reset corrupted data
        window.sessionStorage.removeItem(STORAGE_KEY);
        oldHistory = [];
      }
    }

    // Add new entry with timestamp
    const newEntry = {
      description,
      patients: limitedPatients,
      parameters,
      timestamp: new Date().toISOString(),
    };

    // Implement LRU: Keep only most recent items
    const newHistory = [...oldHistory, newEntry].slice(-MAX_HISTORY_ITEMS);

    // Try to save with quota handling
    try {
      const serialized = JSON.stringify(newHistory);

      window.sessionStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (storageError) {
      if (storageError.name === 'QuotaExceededError') {
        // Fallback: Keep only last 10 items
        const reducedHistory = newHistory.slice(-10);
        try {
          window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(reducedHistory));
          showToast({
            title: 'Search History Limit Reached',
            kind: 'warning',
            description: 'Older search history has been cleared to save space.',
          });
          return true;
        } catch (retryError) {
          // Complete failure - disable history
          window.sessionStorage.removeItem(STORAGE_KEY);
          showToast({
            title: 'Search History Unavailable',
            kind: 'error',
            description: 'Unable to save search history. Your searches will still work.',
          });
          return false;
        }
      }
      throw storageError; // Re-throw unexpected errors
    }
  } catch (error) {
    // Don't break searching if history fails
    showToast({
      title: 'History Error',
      kind: 'error',
      description: 'Could not save search to history, but your search completed successfully.',
    });
    return false;
  }
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * builds a query description based on query input
 * @param {object} state the current state
 * @param {string} conceptName the concept name
 * @returns {string} date in the required format
 */
export const queryDescriptionBuilder = (state, conceptName: string) => {
  const { timeModifier, onOrAfter, onOrBefore } = state;

  const onOrAfterDescription = onOrAfter ? `since ${formatDate(onOrAfter)}` : '';
  const onOrBeforeDescription = onOrBefore ? `until ${formatDate(onOrBefore)}` : '';

  return `Patients with ${timeModifier} ${conceptName} ${onOrAfterDescription} ${onOrBeforeDescription}`.trim();
};

const convertToCSV = (patients: Patient[]) => {
  const csv =
    'patient_id, full_name, age, gender\n' +
    patients
      .map((patient) => {
        const orderedPatient = {
          patientId: patient.patientId,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
        };

        return Object.keys(orderedPatient)
          .map((key) => {
            return `"${patient[key]}"`;
          })
          .join(',');
      })
      .join('\n');

  return csv;
};

export const downloadCSV = (data, filename) => {
  const blob = new Blob([convertToCSV(data)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);

  const pom = document.createElement('a');
  pom.href = url;
  pom.setAttribute('download', filename);
  pom.click();
};
