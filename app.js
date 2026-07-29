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

// ============================================================
// State
// ============================================================
let allData = [];
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
}

function populateFilters() {
  // States
  const states = [...new Set(allData.map(d => d.State))].sort();
  filterState.innerHTML = '<option value="">All States</option>' +
    states.map(s => `<option value="${s}">${s}</option>`).join('');

  // Utilities (populated based on state filter)
  updateUtilityFilter();
}

function updateUtilityFilter() {
  const state = filterState.value;
  let utilities = state
    ? allData.filter(d => d.State === state).map(d => d.Utility)
    : allData.map(d => d.Utility);
  utilities = [...new Set(utilities)].sort();

  filterUtility.innerHTML = '<option value="">All Utilities</option>' +
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

  sampleBody.innerHTML = filteredData.map(row => `
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

  rowCount.textContent = filteredData.length;
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
  document.querySelector('.download-btn')?.addEventListener('click', (e) => {
    // Let the default download happen - the CSV file exists
  });
}

// ============================================================
// Start
// ============================================================
document.addEventListener('DOMContentLoaded', init);