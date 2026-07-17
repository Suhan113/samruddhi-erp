-- SQL Database Schema for Samruddhi Organics ERP
-- Enables relational structures for Customers, Plots, Soil Tests, Recommendations, Dose records, and Inventory/Finance transactions.

-- Enable pgcrypto for gen_random_uuid() if uuid-ossp is not active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Helper: Auto-Update Timestamp Function
-- ==========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 2. Core Tables
-- ==========================================

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_suppliers_modtime 
    BEFORE UPDATE ON suppliers 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Staff', 'Field Worker')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_employees_modtime 
    BEFORE UPDATE ON employees 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_number TEXT NOT NULL UNIQUE, -- e.g. SO-CUST-1001
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    village TEXT,
    taluk TEXT,
    district TEXT,
    crop_details TEXT,
    remarks TEXT,
    documents JSONB DEFAULT '[]'::jsonb, -- Store list of file links/names
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Draft')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_customers_modtime 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Plots Table
CREATE TABLE IF NOT EXISTS plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    plot_number TEXT NOT NULL,
    plot_name TEXT,
    village TEXT,
    taluk TEXT,
    district TEXT,
    crop TEXT,
    crop_variety TEXT,
    plantation_year INTEGER,
    area NUMERIC NOT NULL CHECK (area > 0),
    number_of_plants INTEGER CHECK (number_of_plants >= 0),
    gps_latitude TEXT,
    gps_longitude TEXT,
    google_maps_link TEXT,
    irrigation_type TEXT NOT NULL CHECK (irrigation_type IN ('Drip', 'Sprinkler', 'Flood', 'Rainfed', 'Other')),
    water_source TEXT,
    soil_type TEXT NOT NULL CHECK (soil_type IN ('Red', 'Black', 'Sandy', 'Loamy', 'Clayey', 'Other')),
    land_type TEXT,
    waterlogged_area BOOLEAN DEFAULT false,
    hilly_land BOOLEAN DEFAULT false,
    sandy_soil BOOLEAN DEFAULT false,
    organic_farming BOOLEAN DEFAULT false,
    farmer_has_cow_dung BOOLEAN DEFAULT false,
    farmer_has_poultry_manure BOOLEAN DEFAULT false,
    farmer_has_sheep_manure BOOLEAN DEFAULT false,
    farmer_has_compost BOOLEAN DEFAULT false,
    organic_materials JSONB DEFAULT '[]'::jsonb,
    assigned_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    special_instructions TEXT,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Field Visits Table
CREATE TABLE IF NOT EXISTS field_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    purpose TEXT,
    notes TEXT,
    gps_location TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Plot Photos Table
CREATE TABLE IF NOT EXISTS plot_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Before Application', 'After Application', 'Disease', 'Soil Sample', 'Crop Condition', 'Other')),
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    quote_number TEXT NOT NULL UNIQUE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Approved', 'Rejected')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Uploaded Reports Table
CREATE TABLE IF NOT EXISTS uploaded_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    location TEXT NOT NULL,
    title TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('PDF', 'Excel')),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_plots_modtime 
    BEFORE UPDATE ON plots 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Soil Tests Table
CREATE TABLE IF NOT EXISTS soil_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    report_pdf_url TEXT,
    -- Nutrient Values (All numeric or null if untested)
    ph NUMERIC,
    ec NUMERIC,
    organic_carbon NUMERIC,
    nitrogen NUMERIC,
    phosphorus NUMERIC,
    potassium NUMERIC,
    sulphur NUMERIC,
    calcium NUMERIC,
    magnesium NUMERIC,
    zinc NUMERIC,
    boron NUMERIC,
    iron NUMERIC,
    manganese NUMERIC,
    copper NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_soil_tests_modtime 
    BEFORE UPDATE ON soil_tests 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Materials Master Table (Fertilizers & Organic inputs)
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('Organic', 'Chemical')),
    unit TEXT NOT NULL, -- e.g. Kg, Litre, Bag, Tonne
    stock NUMERIC NOT NULL DEFAULT 0,
    purchase_rate NUMERIC NOT NULL DEFAULT 0,
    selling_rate NUMERIC NOT NULL DEFAULT 0,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_materials_modtime 
    BEFORE UPDATE ON materials 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Recommendations Table (1 Soil Test -> 1 Recommendation)
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    soil_test_id UUID NOT NULL UNIQUE REFERENCES soil_tests(id) ON DELETE CASCADE,
    recommendation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_recommendations_modtime 
    BEFORE UPDATE ON recommendations 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Recommendation Materials Table (1 Recommendation -> Multiple Materials)
CREATE TABLE IF NOT EXISTS recommendation_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    quantity_per_plant NUMERIC, -- e.g. grams/milliliters per plant
    total_quantity NUMERIC NOT NULL CHECK (total_quantity > 0),
    remarks TEXT
);

-- Dose Records Table (1 Recommendation -> 2, 3, or 4 Doses)
CREATE TABLE IF NOT EXISTS dose_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
    dose_number INTEGER NOT NULL CHECK (dose_number BETWEEN 1 AND 4),
    planned_date DATE,
    due_date DATE,
    applied_date DATE,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
    prepared_by TEXT,
    applied_by TEXT,
    remarks TEXT,
    field_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(recommendation_id, dose_number)
);

CREATE TRIGGER update_dose_records_modtime 
    BEFORE UPDATE ON dose_records 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Dose Materials Table
CREATE TABLE IF NOT EXISTS dose_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dose_record_id UUID NOT NULL REFERENCES dose_records(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    quantity_per_plant NUMERIC NOT NULL CHECK (quantity_per_plant >= 0),
    total_quantity NUMERIC NOT NULL CHECK (total_quantity >= 0),
    remarks TEXT
);

-- Dose Versions Table (Audit Trail)
CREATE TABLE IF NOT EXISTS dose_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dose_record_id UUID NOT NULL REFERENCES dose_records(id) ON DELETE CASCADE,
    version INTEGER NOT NULL CHECK (version > 0),
    saved_data JSONB NOT NULL,
    modified_by TEXT NOT NULL,
    modified_date TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. Inventory & Finance Transactions
-- ==========================================

-- Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Inward', 'Outward')),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    rate NUMERIC, -- Rate at which purchase/sale happened
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- General Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL, -- e.g. Rent, Salaries, Transport, Utilities, Office
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 4. Enable Row Level Security (RLS)
-- ==========================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE plot_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_reports ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users full access to tables (Commercial internal application model)
CREATE POLICY "Allow authenticated users full access on suppliers" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on employees" ON employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on customers" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on plots" ON plots FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on soil_tests" ON soil_tests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on materials" ON materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on recommendations" ON recommendations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on recommendation_materials" ON recommendation_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on dose_records" ON dose_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on inventory_transactions" ON inventory_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on payments" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on purchases" ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on expenses" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on field_visits" ON field_visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on plot_photos" ON plot_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on quotations" ON quotations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on invoices" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on uploaded_reports" ON uploaded_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable RLS for new tables
ALTER TABLE dose_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access on dose_materials" ON dose_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access on dose_versions" ON dose_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);
