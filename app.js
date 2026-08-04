// ============================================================
// Sample Data Preview - Interactive Table
// ============================================================

// Load data from JSON file
async function loadSampleData() {
  try {
    const response = await fetch('sample_data_2026.json');
    if (!response.ok) throw new Error('Failed to load data');
    return await response.json();
  } catch (err) {
    console.error('Error loading sample data:', err);
    // Fallback to inline data if fetch fails
    return getFallbackData();
  }
}

function getFallbackData() {
  // Minimal fallback - the JSON file should always be available
  return [];
}

// Load coverage metadata (utility/state/rate codes/date ranges only, no prices)
async function loadCoverageData() {
  try {
    const response = await fetch('coverage_data.json');
    if (!response.ok) throw new Error('Failed to load coverage data');
    return await response.json();
  } catch (err) {
    console.error('Error loading coverage data:', err);
    return [];
  }
}

// ============================================================
// Config
// ============================================================
const MAX_ROWS = 20;

// ============================================================
// State
// ============================================================
let allData = [];
let fullData = [];
let filteredData = [];
let sortColumn = 'Date';
let sortDirection = 'asc';

// ============================================================
// DOM Elements
// ============================================================
const filterState = document.getElementById('filterState');
const filterUtility = document.getElementById('filterUtility');
const sampleBody = document.getElementById('sampleBody');
const rowCount = document.getElementById('rowCount');
const totalRows = document.getElementById('totalRows');

// ============================================================
// Init
// ============================================================
async function init() {
  allData = await loadSampleData();
  if (allData.length === 0) {
    sampleBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999;">Failed to load data</td></tr>';
    return;
  }

  populateFilters();
  applyFilters();
  attachEventListeners();

  // Reset horizontal scroll position (direction: rtl moves scrollbar to top but starts scrolled right)
  const wrapper = document.querySelector('.table-wrapper');
  if (wrapper) wrapper.scrollLeft = 0;

  // Load coverage metadata for the explorer
  fullData = await loadCoverageData();
  initCoverageExplorer();
}

function populateFilters() {
  // States
  const states = [...new Set(allData.map(d => d.State))].sort();
  filterState.innerHTML =
    states.map(s => `<option value="${s}">${s}</option>`).join('');

  // Default to first state alphabetically
  if (states.length > 0) {
    filterState.value = states[0];
  }

  // Utilities (populated based on state filter)
  updateUtilityFilter();
}

function updateUtilityFilter() {
  const state = filterState.value;
  let utilities = state
    ? allData.filter(d => d.State === state).map(d => d.Utility)
    : allData.map(d => d.Utility);
  utilities = [...new Set(utilities)].sort();

  filterUtility.innerHTML =
    utilities.map(u => `<option value="${u}">${u}</option>`).join('');
}

// ============================================================
// Filtering & Sorting
// ============================================================
function applyFilters() {
  let data = allData;

  if (filterState.value) {
    data = data.filter(d => d.State === filterState.value);
  }
  if (filterUtility.value) {
    data = data.filter(d => d.Utility === filterUtility.value);
  }

  filteredData = data;
  sortData();
  renderTable();
}

function sortData() {
  filteredData.sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    // Numeric columns
    if (['Service_Charge', 'Energy_Charge', 'Surcharges_Per_kWh', 'Total_Per_kWh'].includes(sortColumn)) {
      valA = parseFloat(valA) || 0;
      valB = parseFloat(valB) || 0;
    } else if (sortColumn === 'Date') {
      valA = new Date(valA);
      valB = new Date(valB);
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

// ============================================================
// Rendering
// ============================================================
function renderTable() {
  if (filteredData.length === 0) {
    sampleBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999;">No matching records</td></tr>';
    rowCount.textContent = '0';
    totalRows.textContent = '0';
    updateSortIndicators();
    return;
  }

  const displayData = filteredData.slice(0, MAX_ROWS);

  sampleBody.innerHTML = displayData.map(row => `
    <tr>
      <td>${formatDate(row.Date)}</td>
      <td>${row.State}</td>
      <td>${escapeHtml(row.Utility)}</td>
      <td>${escapeHtml(row.Rate_Code)}</td>
      <td class="num">$${parseFloat(row.Service_Charge).toFixed(2)}</td>
      <td class="num">${parseFloat(row.Energy_Charge).toFixed(4)}</td>
      <td class="num">${parseFloat(row.Surcharges_Per_kWh).toFixed(4)}</td>
      <td class="num">${parseFloat(row.Total_Per_kWh).toFixed(4)}</td>
    </tr>
  `).join('');

  rowCount.textContent = `${displayData.length} of ${filteredData.length}`;
  totalRows.textContent = allData.length;
  updateSortIndicators();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateSortIndicators() {
  document.querySelectorAll('#sampleTable th[data-col]').forEach(th => {
    const col = th.dataset.col;
    const arrow = th.querySelector('.sort-arrow');
    if (col === sortColumn) {
      arrow.textContent = sortDirection === 'asc' ? '▲' : '▼';
      arrow.style.color = 'var(--primary)';
    } else {
      arrow.textContent = '▲▼';
      arrow.style.color = 'var(--text-lighter)';
    }
  });
}

// ============================================================
// Event Listeners
// ============================================================
function attachEventListeners() {
  // Filter changes
  filterState.addEventListener('change', () => {
    updateUtilityFilter();
    applyFilters();
  });
  filterUtility.addEventListener('change', applyFilters);

  // Sort on header click
  document.querySelectorAll('#sampleTable th[data-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      if (col === sortColumn) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = col;
        sortDirection = 'asc';
      }
      sortData();
      renderTable();
    });
  });

  // Download button - trigger CSV download
  document.querySelector('.download-btn')?.addEventListener('click', () => {
    // Let the default download happen - the CSV file exists
  });
}

// ============================================================
// Data Coverage Explorer (uses full CSV data)
// ============================================================
function initCoverageExplorer() {
  const coverageState = document.getElementById('coverageState');
  const coverageSelect = document.getElementById('coverageSelect');
  const coverageResult = document.getElementById('coverageResult');

  if (!coverageState || !coverageSelect || !coverageResult || fullData.length === 0) return;

  // Populate state filter
  const coverageStates = [...new Set(fullData.map(d => d.State))].sort();
  coverageState.innerHTML = '<option value="">All States</option>' +
    coverageStates.map(s => `<option value="${s}">${s}</option>`).join('');

  function updateCoverageUtilities() {
    const state = coverageState.value;
    let utilities = state
      ? fullData.filter(d => d.State === state).map(d => d.Utility)
      : fullData.map(d => d.Utility);
    utilities = [...new Set(utilities)].sort();

    coverageSelect.innerHTML = '<option value="">Select a utility...</option>' +
      utilities.map(u => `<option value="${u}">${u}</option>`).join('');
    coverageResult.style.display = 'none';
    coverageResult.innerHTML = '';
  }

  function showCoverage() {
    const utility = coverageSelect.value;
    if (!utility) return;

    const entry = fullData.find(d => d.Utility === utility);
    if (!entry) return;

    const dateRange = entry.First_Month && entry.Last_Month
      ? `${entry.First_Month.slice(0,7)} – ${entry.Last_Month.slice(0,7)}`
      : 'N/A';

    coverageResult.style.display = 'block';
    coverageResult.innerHTML = `
      <h3>${entry.Utility} (${entry.State})</h3>
      <p><strong>Date Range:</strong> ${dateRange}</p>
      <p><strong>Rate Codes:</strong> ${entry.Rate_Codes.join(', ')}</p>
      <p><strong>Months of Data:</strong> ${entry.Months}</p>
    `;
  }

  coverageState.addEventListener('change', updateCoverageUtilities);
  coverageSelect.addEventListener('change', showCoverage);
}

// ============================================================
// Start
// ============================================================
document.addEventListener('DOMContentLoaded', init);