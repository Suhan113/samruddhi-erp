// LocalStorage Database Client
// Mimics a relational database inside the browser for offline/local-first operation.

export const STORAGE_PREFIX = "samruddhi_db_";

// Helper to generate a random UUID-like string
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const DB_TABLES = [
  "suppliers",
  "employees",
  "customers",
  "plots",
  "soil_tests",
  "materials",
  "recommendations",
  "recommendation_materials",
  "dose_records",
  "inventory_transactions",
  "payments",
  "purchases",
  "expenses",
  "field_visits",
  "plot_photos",
  "quotations",
  "invoices",
  "uploaded_reports",
  "dose_materials",
  "dose_versions"
];

// Initialize DB if not already initialized
export function initLocalStorageDb() {
  DB_TABLES.forEach((table) => {
    const key = STORAGE_PREFIX + table;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify([]));
    }
  });
}

// Clear all databases
export function clearLocalStorageDb() {
  DB_TABLES.forEach((table) => {
    localStorage.removeItem(STORAGE_PREFIX + table);
  });
}

// Core Relational Engine
export const localStorageDb = {
  // Query all items
  select(table) {
    initLocalStorageDb();
    const key = STORAGE_PREFIX + table;
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      console.error(`Error reading table ${table} from localStorage`, e);
      return [];
    }
  },

  // Query a single item by id
  selectById(table, id) {
    const items = this.select(table);
    return items.find(item => item.id === id) || null;
  },

  // Query items matching a filter object
  selectWhere(table, filterObj) {
    const items = this.select(table);
    return items.filter(item => {
      return Object.keys(filterObj).every(key => item[key] === filterObj[key]);
    });
  },

  // Insert a new row
  insert(table, itemData) {
    initLocalStorageDb();
    const items = this.select(table);
    const newItem = {
      id: itemData.id || generateId(),
      ...itemData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Auto-generate customer number if inserting into customers
    if (table === 'customers' && !newItem.customer_number) {
      const activeCustomers = items.length;
      newItem.customer_number = `SO-CUST-${String(activeCustomers + 1001).padStart(4, '0')}`;
    }

    const nextItems = [...items, newItem];
    localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(nextItems));
    return newItem;
  },

  // Update an existing row
  update(table, id, updatedData) {
    initLocalStorageDb();
    const items = this.select(table);
    let updatedItem = null;
    
    const nextItems = items.map(item => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          ...updatedData,
          updated_at: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });

    if (!updatedItem) {
      throw new Error(`Record with id ${id} not found in table ${table}`);
    }

    localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(nextItems));
    return updatedItem;
  },

  // Delete a row
  delete(table, id) {
    initLocalStorageDb();
    const items = this.select(table);
    const filteredItems = items.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(filteredItems));
    return true;
  }
};
