// Unified Database Service Client
// Toggles between Supabase API and LocalStorage database depending on presence of credentials.

import { createClient } from "@supabase/supabase-js";
import { localStorageDb } from "./localStorageDb";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isSupabaseConfigured = 
  supabaseUrl.trim() !== "" && 
  supabaseAnonKey.trim() !== "" && 
  !supabaseUrl.includes("your-supabase-url");

let supabase = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("🟢 Samruddhi ERP: Supabase Mode active.");
  } catch (error) {
    console.error("🔴 Failed to initialize Supabase client. Falling back to Local Mode.", error);
  }
} else {
  console.log("🟡 Samruddhi ERP: Supabase keys not detected or invalid. Running in Local Mode (LocalStorage).");
}

export const db = {
  isSupabase() {
    return isSupabaseConfigured && supabase !== null;
  },

  // Auth Operations
  async signIn(email, password) {
    if (this.isSupabase()) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, message: error.message };
      return { 
        success: true, 
        user: { 
          id: data.user.id, 
          email: data.user.email, 
          name: data.user.user_metadata?.name || email.split("@")[0] 
        } 
      };
    } else {
      // Offline/Local Auth check
      const users = localStorageDb.select("employees");
      let matched = users.find(u => u.email === email && u.status === "Active");
      
      // Allow fallback admin login if DB is empty so the user is not locked out
      if (!matched && email === "admin@samruddhi.com" && (password === "admin123" || password === "password")) {
        matched = { id: "admin-fallback", email: "admin@samruddhi.com", name: "System Admin", role: "Admin", status: "Active" };
      }

      if (!matched) {
        return { success: false, message: "Invalid email or inactive employee profile." };
      }
      
      // Since it's local mode, we allow bypass or custom password checking
      // For local testing, any password matching "admin123" or standard name works
      if (password !== "admin123" && password !== "password") {
        return { success: false, message: "Incorrect password. (Try 'admin123' or 'password')" };
      }
      
      const sessionUser = { id: matched.id, email: matched.email, name: matched.name, role: matched.role };
      localStorage.setItem("samruddhi_session", JSON.stringify(sessionUser));
      return { success: true, user: sessionUser };
    }
  },

  async signOut() {
    if (this.isSupabase()) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("samruddhi_session");
    }
  },

  async getCurrentUser() {
    if (this.isSupabase()) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return { 
        id: user.id, 
        email: user.email, 
        name: user.user_metadata?.name || user.email.split("@")[0] 
      };
    } else {
      const raw = localStorage.getItem("samruddhi_session");
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  },

  // Database CRUD Operations
  async select(table, orderBy = "created_at", ascending = false) {
    if (this.isSupabase()) {
      let query = supabase.from(table).select("*");
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }
      const { data, error } = await query;
      if (error) {
        console.error(`Supabase error reading from ${table}:`, error);
        throw error;
      }
      return data;
    } else {
      let items = localStorageDb.select(table);
      if (orderBy) {
        items = [...items].sort((a, b) => {
          const valA = a[orderBy] || "";
          const valB = b[orderBy] || "";
          if (valA < valB) return ascending ? -1 : 1;
          if (valA > valB) return ascending ? 1 : -1;
          return 0;
        });
      }
      return items;
    }
  },

  async selectById(table, id) {
    if (this.isSupabase()) {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      if (error) {
        console.error(`Supabase error reading from ${table} ID ${id}:`, error);
        throw error;
      }
      return data;
    } else {
      return localStorageDb.selectById(table, id);
    }
  },

  async selectWhere(table, filterObj, orderBy = "created_at", ascending = false) {
    if (this.isSupabase()) {
      let query = supabase.from(table).select("*");
      Object.keys(filterObj).forEach(key => {
        query = query.eq(key, filterObj[key]);
      });
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }
      const { data, error } = await query;
      if (error) {
        console.error(`Supabase error searching ${table}:`, error);
        throw error;
      }
      return data;
    } else {
      let items = localStorageDb.selectWhere(table, filterObj);
      if (orderBy) {
        items = [...items].sort((a, b) => {
          const valA = a[orderBy] || "";
          const valB = b[orderBy] || "";
          if (valA < valB) return ascending ? -1 : 1;
          if (valA > valB) return ascending ? 1 : -1;
          return 0;
        });
      }
      return items;
    }
  },
async deleteWhere(table, filterObj) {
  if (this.isSupabase()) {
    let query = supabase.from(table).delete();

    Object.keys(filterObj).forEach(key => {
      query = query.eq(key, filterObj[key]);
    });

    const { error } = await query;

    if (error) {
      console.error(`Supabase error deleting from ${table}:`, error);
      throw error;
    }

    return true;
  } else {
    return localStorageDb.deleteWhere(table, filterObj);
  }
},
async insert(table, itemData) {
  if (this.isSupabase()) {

    console.log("TABLE:", table);
    console.log("ITEM DATA:", itemData);
    console.log("SUPPLIER ID =", itemData.supplier_id);
    console.log("TYPE =", typeof itemData.supplier_id);

    const { data, error } = await supabase
      .from(table)
      .insert([itemData])
      .select()
      .single();

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  } else {
    return localStorageDb.insert(table, itemData);
  }
},
async update(table, id, updatedData) {
  if (this.isSupabase()) {

    console.log("UPDATE TABLE:", table);
    console.log("UPDATE ID:", id);
    console.log("UPDATE DATA:");
    console.log(JSON.stringify(updatedData, null, 2));

    const { data, error } = await supabase
      .from(table)
      .update(updatedData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  } else {
    return localStorageDb.update(table, id, updatedData);
  }
},

  async delete(table, id) {
    if (this.isSupabase()) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) {
        console.error(`Supabase error deleting from ${table} ID ${id}:`, error);
        throw error;
      }
      return true;
    } else {
      return localStorageDb.delete(table, id);
    }
  }
};
