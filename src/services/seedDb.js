import { STORAGE_PREFIX } from "./localStorageDb";

export const SEED_DATA = {
  suppliers: [
    { id: "sup-1", name: "Green Earth Organics", contact_person: "Vijay Patil", phone: "9850123456", email: "vijay@greenearth.com", address: "MIDC Phase 2, Satara" },
    { id: "sup-2", name: "Modern Agro Chemicals", contact_person: "Aniket Shah", phone: "9123456789", email: "info@modernagro.com", address: "Swargate, Pune" }
  ],
  employees: [
    { id: "emp-1", name: "Amit Shinde", email: "admin@samruddhi.com", phone: "9422019283", role: "Admin", status: "Active" },
    { id: "emp-2", name: "Suresh Pawar", email: "suresh@samruddhi.com", phone: "9890214354", role: "Staff", status: "Active" },
    { id: "emp-3", name: "Dnyaneshwar Yadav", email: "dnyanesh@samruddhi.com", phone: "9011223344", role: "Field Worker", status: "Active" }
  ],
  customers: [
    {
      id: "cust-1",
      customer_number: "SO-CUST-1001",
      name: "Ramesh Patil",
      phone: "9876543210",
      address: "Gat No 415, Near Hanuman Temple",
      village: "Nandgaon",
      taluk: "Karad",
      district: "Satara",
      crop_details: "Sugarcane (Co 86032)",
      remarks: "Requires high organic manure due to low carbon status.",
      documents: JSON.stringify([{ name: "Aadhar_Ramesh.pdf", url: "#" }]),
      status: "Active"
    },
    {
      id: "cust-2",
      customer_number: "SO-CUST-1002",
      name: "Sanjay More",
      phone: "9765432109",
      address: "Wathar Road, Opp Gram Panchayat",
      village: "Koregaon",
      taluk: "Koregaon",
      district: "Satara",
      crop_details: "Ginger & Turmeric",
      remarks: "Very progressive farmer, interested in bio-fertilizers.",
      documents: JSON.stringify([]),
      status: "Active"
    },
    {
      id: "cust-3",
      customer_number: "SO-CUST-1003",
      name: "Ananda Deshmukh",
      phone: "9922334455",
      address: "Deshmukh Vasti",
      village: "Bhilawadi",
      taluk: "Palus",
      district: "Sangli",
      crop_details: "Grapes (Thompson Seedless)",
      remarks: "Saline soil issues, requires soil-conditioners.",
      documents: JSON.stringify([]),
      status: "Pending"
    }
  ],
  plots: [
    {
      id: "plot-1",
      customer_id: "cust-1",
      plot_number: "Plot-1",
      plot_name: "Home Field Arecanut",
      village: "Nandgaon",
      taluk: "Karad",
      district: "Satara",
      crop: "Arecanut",
      crop_variety: "Mohitnagar",
      plantation_year: 2020,
      area: 2.5,
      number_of_plants: 800,
      gps_latitude: "17.2856",
      gps_longitude: "74.1834",
      google_maps_link: "https://maps.google.com/?q=17.2856,74.1834",
      irrigation_type: "Drip",
      water_source: "Borewell",
      soil_type: "Black",
      land_type: "Plain",
      waterlogged_area: false,
      hilly_land: false,
      sandy_soil: false,
      organic_farming: true,
      farmer_has_cow_dung: true,
      farmer_has_poultry_manure: false,
      farmer_has_sheep_manure: false,
      farmer_has_compost: true,
      organic_materials: JSON.stringify(["Cow Dung", "Compost"]),
      assigned_employee_id: "emp-2",
      special_instructions: "Regular drip monitoring required during summer months.",
      remarks: "Healthy arecanut saplings, showing good initial growth.",
      status: "Active"
    },
    {
      id: "plot-2",
      customer_id: "cust-1",
      plot_number: "Plot-2",
      plot_name: "River Side Coconut",
      village: "Nandgaon",
      taluk: "Karad",
      district: "Satara",
      crop: "Coconut",
      crop_variety: "West Coast Tall",
      plantation_year: 2018,
      area: 1.8,
      number_of_plants: 150,
      gps_latitude: "17.2912",
      gps_longitude: "74.1901",
      google_maps_link: "https://maps.google.com/?q=17.2912,74.1901",
      irrigation_type: "Flood",
      water_source: "River/Stream",
      soil_type: "Loamy",
      land_type: "Plain",
      waterlogged_area: true,
      hilly_land: false,
      sandy_soil: false,
      organic_farming: false,
      farmer_has_cow_dung: true,
      farmer_has_poultry_manure: true,
      farmer_has_sheep_manure: false,
      farmer_has_compost: false,
      organic_materials: JSON.stringify(["Cow Dung", "Poultry Manure"]),
      assigned_employee_id: "emp-3",
      special_instructions: "Monitor drainage during monsoon seasons.",
      remarks: "Soil is alluvial and highly fertile but drains slowly.",
      status: "Active"
    },
    {
      id: "plot-3",
      customer_id: "cust-2",
      plot_number: "Plot-1",
      plot_name: "Hillside Coffee",
      village: "Koregaon",
      taluk: "Koregaon",
      district: "Satara",
      crop: "Coffee",
      crop_variety: "Coorg Green Robusta",
      plantation_year: 2021,
      area: 3.0,
      number_of_plants: 1200,
      gps_latitude: "17.7011",
      gps_longitude: "74.1623",
      google_maps_link: "https://maps.google.com/?q=17.7011,74.1623",
      irrigation_type: "Drip",
      water_source: "Rainwater",
      soil_type: "Red",
      land_type: "Hilly",
      waterlogged_area: false,
      hilly_land: true,
      sandy_soil: false,
      organic_farming: true,
      farmer_has_cow_dung: false,
      farmer_has_poultry_manure: false,
      farmer_has_sheep_manure: true,
      farmer_has_compost: true,
      organic_materials: JSON.stringify(["Sheep Manure", "Compost", "Vermicompost"]),
      assigned_employee_id: "emp-2",
      special_instructions: "Terrace bunding requires maintenance before next rain.",
      remarks: "Grown under shade trees. High iron expected in soil.",
      status: "Active"
    }
  ],
  soil_tests: [
    {
      id: "st-1",
      plot_id: "plot-1",
      report_date: "2026-06-10",
      report_pdf_url: "",
      ph: 7.8,
      ec: 0.45,
      organic_carbon: 0.35, 
      nitrogen: 210, 
      phosphorus: 14, 
      potassium: 340, 
      sulphur: 8.5, 
      calcium: 1200,
      magnesium: 320,
      zinc: 0.48, 
      boron: 0.35, 
      iron: 4.2,
      manganese: 3.1,
      copper: 0.25
    },
    {
      id: "st-2",
      plot_id: "plot-3",
      report_date: "2026-06-15",
      report_pdf_url: "",
      ph: 6.5,
      ec: 0.28,
      organic_carbon: 0.55, 
      nitrogen: 245,
      phosphorus: 9.0, 
      potassium: 190, 
      sulphur: 12.0,
      calcium: 850,
      magnesium: 180,
      zinc: 0.65,
      boron: 0.52,
      iron: 9.5, 
      manganese: 4.0,
      copper: 0.4
    }
  ],
  materials: [
    { id: "mat-1", name: "Premium Poultry Manure", category: "Organic", unit: "Tonne", stock: 15.0, purchase_rate: 3500, selling_rate: 4500, supplier_id: "sup-1" },
    { id: "mat-2", name: "Decomposed Cow Dung", category: "Organic", unit: "Tonne", stock: 24.0, purchase_rate: 2000, selling_rate: 2800, supplier_id: "sup-1" },
    { id: "mat-3", name: "Neem Cake Powder", category: "Organic", unit: "Bag (50kg)", stock: 85, purchase_rate: 800, selling_rate: 1100, supplier_id: "sup-1" },
    { id: "mat-4", name: "Trichoderma Viride Bio-Fungicide", category: "Organic", unit: "Kg", stock: 120, purchase_rate: 150, selling_rate: 220, supplier_id: "sup-1" },
    { id: "mat-5", name: "Pseudomonas Fluorescens", category: "Organic", unit: "Kg", stock: 90, purchase_rate: 160, selling_rate: 230, supplier_id: "sup-1" },
    { id: "mat-6", name: "Granulated Rock Phosphate", category: "Chemical", unit: "Bag (50kg)", stock: 45, purchase_rate: 650, selling_rate: 850, supplier_id: "sup-2" },
    { id: "mat-7", name: "Natural Potassium (K-Schoenite)", category: "Chemical", unit: "Bag (50kg)", stock: 35, purchase_rate: 1100, selling_rate: 1400, supplier_id: "sup-2" },
    { id: "mat-8", name: "Bensulf (Sulphur 90%)", category: "Chemical", unit: "Kg", stock: 200, purchase_rate: 90, selling_rate: 130, supplier_id: "sup-2" },
    { id: "mat-9", name: "Disodium Octaborate (Boron 20%)", category: "Chemical", unit: "Kg", stock: 50, purchase_rate: 220, selling_rate: 310, supplier_id: "sup-2" },
    { id: "mat-10", name: "Chelated Zinc (Zn-EDTA 12%)", category: "Chemical", unit: "Kg", stock: 75, purchase_rate: 280, selling_rate: 380, supplier_id: "sup-2" }
  ],
  recommendations: [
    { id: "rec-1", soil_test_id: "st-1", recommendation_date: "2026-06-12", remarks: "Low Organic Carbon and low Nitrogen require intensive manure treatment along with Zinc and Boron supplements." }
  ],
  recommendation_materials: [
    { id: "recm-1", recommendation_id: "rec-1", material_id: "mat-1", quantity_per_plant: null, total_quantity: 2.0, remarks: "Apply during land preparation" },
    { id: "recm-2", recommendation_id: "rec-1", material_id: "mat-3", quantity_per_plant: 0.2, total_quantity: 10, remarks: "Mix with manure" },
    { id: "recm-3", recommendation_id: "rec-1", material_id: "mat-4", quantity_per_plant: null, total_quantity: 5, remarks: "Apply as soil drench" },
    { id: "recm-4", recommendation_id: "rec-1", material_id: "mat-6", quantity_per_plant: null, total_quantity: 5, remarks: "Basal dose" },
    { id: "recm-5", recommendation_id: "rec-1", material_id: "mat-10", quantity_per_plant: 0.005, total_quantity: 2, remarks: "Micronutrient correction" }
  ],
  dose_records: [
    { 
      id: "dose-1", 
      recommendation_id: "rec-1", 
      dose_number: 1, 
      planned_date: "2026-06-15", 
      due_date: "2026-06-22", 
      applied_date: "2026-06-15", 
      status: "Completed", 
      prepared_by: "Amit Shinde", 
      applied_by: "Dnyaneshwar Yadav", 
      remarks: "Basal manure dose application planned.", 
      field_remarks: "Applied before planting. Good soil moisture." 
    },
    { 
      id: "dose-2", 
      recommendation_id: "rec-1", 
      dose_number: 2, 
      planned_date: "2026-07-10", 
      due_date: "2026-07-17", 
      applied_date: null, 
      status: "Pending", 
      prepared_by: "Amit Shinde", 
      applied_by: "", 
      remarks: "Top dressing with Neem cake & Trichoderma.", 
      field_remarks: "" 
    },
    { 
      id: "dose-3", 
      recommendation_id: "rec-1", 
      dose_number: 3, 
      planned_date: "2026-08-15", 
      due_date: "2026-08-22", 
      applied_date: null, 
      status: "Pending", 
      prepared_by: "Amit Shinde", 
      applied_by: "", 
      remarks: "Rock phosphate basal supplement.", 
      field_remarks: "" 
    },
    { 
      id: "dose-4", 
      recommendation_id: "rec-1", 
      dose_number: 4, 
      planned_date: "2026-09-20", 
      due_date: "2026-09-27", 
      applied_date: null, 
      status: "Pending", 
      prepared_by: "Amit Shinde", 
      applied_by: "", 
      remarks: "Zinc trace supplement corrective spray.", 
      field_remarks: "" 
    }
  ],
  inventory_transactions: [
    { id: "tx-1", material_id: "mat-1", transaction_type: "Inward", quantity: 20.0, rate: 3500, description: "Opening Stock Purchase", created_at: "2026-06-01T10:00:00Z" },
    { id: "tx-2", material_id: "mat-1", transaction_type: "Outward", quantity: 2.0, rate: 4500, description: "Consumption for Recommendation REC-1 (Ramesh Patil)", created_at: "2026-06-15T16:30:00Z" },
    { id: "tx-3", material_id: "mat-3", transaction_type: "Inward", quantity: 100, rate: 800, description: "Standard Stock Purchase", created_at: "2026-06-02T11:00:00Z" }
  ],
  payments: [
    { id: "pay-1", customer_id: "cust-1", amount: 15000, payment_date: "2026-06-16", payment_method: "UPI", remarks: "Advance payment for materials", created_at: "2026-06-16T12:00:00Z" },
    { id: "pay-2", customer_id: "cust-2", amount: 4500, payment_date: "2026-06-20", payment_method: "Cash", remarks: "Soil testing consultation fees", created_at: "2026-06-20T15:00:00Z" }
  ],
  purchases: [
    { id: "pur-1", supplier_id: "sup-1", amount: 70000, purchase_date: "2026-06-01", remarks: "Poultry manure bulk purchase", created_at: "2026-06-01T09:00:00Z" },
    { id: "pur-2", supplier_id: "sup-2", amount: 35000, purchase_date: "2026-06-02", remarks: "Chemical fertilizers initial load", created_at: "2026-06-02T10:30:00Z" }
  ],
  expenses: [
    { id: "exp-1", amount: 12000, category: "Rent", expense_date: "2026-06-05", description: "Warehouse rent June 2026", created_at: "2026-06-05T12:00:00Z" },
    { id: "exp-2", amount: 4500, category: "Transport", expense_date: "2026-06-16", description: "Diesel for delivery vehicle", created_at: "2026-06-16T18:00:00Z" }
  ],
  field_visits: [
    {
      id: "fv-1",
      plot_id: "plot-1",
      visit_date: "2026-06-20",
      employee_id: "emp-3",
      purpose: "Soil Check",
      notes: "Checked drip lateral positions and dripper discharge. Soil compaction is moderate. Advised farmer on using compost.",
      gps_location: "17.2856, 74.1834",
      photos: JSON.stringify(["https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=400&q=80"])
    },
    {
      id: "fv-2",
      plot_id: "plot-1",
      visit_date: "2026-07-12",
      employee_id: "emp-3",
      purpose: "Dose verification",
      notes: "Checked Dose 1 results. Crop condition is good. Farmer has applied Cow Dung as advised.",
      gps_location: "17.2856, 74.1834",
      photos: JSON.stringify([])
    }
  ],
  plot_photos: [
    {
      id: "ph-1",
      plot_id: "plot-1",
      category: "Soil Sample",
      url: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=400&q=80",
      description: "Taken during core sample collection.",
      created_at: "2026-06-10"
    },
    {
      id: "ph-2",
      plot_id: "plot-1",
      category: "Before Application",
      url: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=400&q=80",
      description: "Arecanut crop condition before first organic manure dose application.",
      created_at: "2026-06-14"
    }
  ],
  quotations: [
    {
      id: "qt-1",
      plot_id: "plot-1",
      customer_id: "cust-1",
      quote_number: "SO-QT-2026-001",
      date: "2026-06-12",
      amount: 18000,
      status: "Approved",
      remarks: "Includes 2 Tonnes of Premium Poultry Manure and Neem Cake supplements."
    }
  ],
  invoices: [
    {
      id: "inv-1",
      plot_id: "plot-1",
      customer_id: "cust-1",
      invoice_number: "SO-INV-2026-001",
      date: "2026-06-15",
      amount: 18000,
      status: "Paid",
      remarks: "Paid in full via UPI on 2026-06-16."
    },
    {
      id: "inv-2",
      plot_id: "plot-1",
      customer_id: "cust-1",
      invoice_number: "SO-INV-2026-002",
      date: "2026-07-10",
      amount: 6500,
      status: "Sent",
      remarks: "Invoice for Dose-2 materials."
    }
  ],
  uploaded_reports: [
    {
      id: "ur-1",
      customer_id: "cust-1",
      customer_name: "Ramesh Patil",
      location: "Nandgaon",
      title: "Arecanut Plot Soil Analysis 2026",
      file_type: "PDF",
      file_name: "Ramesh_Soil_Report_June26.pdf",
      file_url: "data:application/pdf;base64,JVBERi0xLjQKJSDi48VyCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNCAwIFIKPj4KPj4KL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iago5IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDU1Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKODUgNzAwIFRkCihTYW1ydWRkaGkgT3JnYW5pY3MgLSBTb2lsIFRlc3QgUmVwb3J0IC0gUmFtZXNoIFBhdGlsKSBUagogRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA3MCAwMDAwMCBuIAowMDAwMDAwMTIwIDAwMDAwIG4gCjAwMDAwMDAyNzQgMDAwMDAgbiAKMDAwMDAwMDM0OCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MgolJUVPRg==",
      remarks: "Official testing from Regional Soil Chemistry Lab showing organic carbon depletion."
    },
    {
      id: "ur-2",
      customer_id: "cust-2",
      customer_name: "Sanjay More",
      location: "Koregaon",
      title: "Ginger Crop Yield Forecasting",
      file_type: "Excel",
      file_name: "Sanjay_Yield_Forecast_2026.xlsx",
      file_url: "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsBAhQAFAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      remarks: "Estimated target yield for early harvest batch."
    }
  ],
  dose_materials: [
    {
      id: "dm-1",
      dose_record_id: "dose-1",
      material_id: "mat-1",
      quantity_per_plant: 2.5,
      total_quantity: 1500,
      remarks: "Basal dose"
    },
    {
      id: "dm-2",
      dose_record_id: "dose-1",
      material_id: "mat-3",
      quantity_per_plant: 0.5,
      total_quantity: 300,
      remarks: "Mix with manure"
    },
    {
      id: "dm-3",
      dose_record_id: "dose-2",
      material_id: "mat-3",
      quantity_per_plant: 0.5,
      total_quantity: 300,
      remarks: "Dose 2 top dressing"
    },
    {
      id: "dm-4",
      dose_record_id: "dose-2",
      material_id: "mat-4",
      quantity_per_plant: 0.025,
      total_quantity: 15,
      remarks: "Fungal protection"
    },
    {
      id: "dm-5",
      dose_record_id: "dose-3",
      material_id: "mat-6",
      quantity_per_plant: 0.5,
      total_quantity: 300,
      remarks: "Phosphorus release"
    },
    {
      id: "dm-6",
      dose_record_id: "dose-3",
      material_id: "mat-10",
      quantity_per_plant: 0.02,
      total_quantity: 12,
      remarks: "Zinc supplement"
    },
    {
      id: "dm-7",
      dose_record_id: "dose-4",
      material_id: "mat-10",
      quantity_per_plant: 0.02,
      total_quantity: 12,
      remarks: "Final trace spray"
    }
  ],
  dose_versions: [
    {
      id: "dv-1",
      dose_record_id: "dose-1",
      version: 1,
      saved_data: JSON.stringify({
        planned_date: "2026-06-15",
        due_date: "2026-06-22",
        status: "Completed",
        prepared_by: "Amit Shinde",
        remarks: "First dose for रमेश पाटील's plot. Checked organic matters availability.",
        materials: [
          { material_id: "mat-1", quantity_per_plant: 2.5, total_quantity: 1500, remarks: "Basal dose" },
          { material_id: "mat-3", quantity_per_plant: 0.5, total_quantity: 300, remarks: "Mix with manure" }
        ]
      }),
      modified_by: "Amit Shinde",
      modified_date: "2026-06-12T10:15:00Z"
    }
  ]
};

export function seedDemoData() {
  Object.keys(SEED_DATA).forEach((table) => {
    const key = STORAGE_PREFIX + table;
    localStorage.setItem(key, JSON.stringify(SEED_DATA[table]));
  });
}
