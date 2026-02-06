import { supabase } from './supabaseClient';
import { validateMachineData, cleanMachineData } from '../utils/csvParser';

console.log('entities.js loaded, supabase client available:', !!supabase);

// ============================================================
// UTILITY FUNCTION: Clean empty strings to null
// ============================================================
const cleanData = (data) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === '' || cleaned[key] === undefined) {
      cleaned[key] = null;
    }
  });
  return cleaned;
};

// ============================================================
// UTILITY FUNCTION: Get current user for RLS policies
// ============================================================
const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated');
  }
  return user;
};

// ============================================================
// UTILITY FUNCTION: Add user metadata to data
// ============================================================
const addUserMetadata = async (data) => {
  const user = await getCurrentUser();
  return {
    ...data,
    created_by: user.id,
    updated_by: user.id
  };
};

// ============================================================
// UTILITY FUNCTION: Add update metadata to data
// ============================================================
const addUpdateMetadata = async (data) => {
  const user = await getCurrentUser();
  return {
    ...data,
    updated_by: user.id
  };
};

// ============================================================
// UTILITY FUNCTION: Generic filter for any entity
// ============================================================
const createFilterMethod = (tableName) => {
  return async (filters = {}) => {
    let query = supabase.from(tableName).select('*');
    
    // Add filters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        query = query.eq(key, filters[key]);
      }
    });
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };
};

// ============================================================
// MACHINES API
// ============================================================
export const Machine = {
  async list(orderBy = null, limit = null) {
    let query = supabase.from('machines').select('*');
    
    if (orderBy) {
      const [field, direction] = orderBy.startsWith('-') 
        ? [orderBy.slice(1), 'desc'] 
        : [orderBy, 'asc'];
      query = query.order(field, { ascending: direction === 'asc' });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(machineData) {
    try {
      const cleaned = cleanData(machineData);
      const dataWithUser = await addUserMetadata(cleaned);
      
      console.log('Machine.create() with user ID:', dataWithUser.created_by);
      
      const { data, error } = await supabase
        .from('machines')
        .insert([dataWithUser])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Machine.create() error:', err);
      throw err;
    }
  },

  async update(id, machineData) {
    try {
      const cleaned = cleanData(machineData);
      const dataWithUser = await addUpdateMetadata(cleaned);
      
      const { data, error } = await supabase
        .from('machines')
        .update(dataWithUser)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Machine.update() error:', err);
      throw err;
    }
  },

  async delete(id) {
    const { error } = await supabase
      .from('machines')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async batchImport(machines) {
    // Validate and clean each machine record
    const results = {
      success: [],
      failed: [],
      total: machines.length,
    };

    const processedMachines = [];

    for (let i = 0; i < machines.length; i++) {
      const machine = machines[i];
      try {
        // Validate the machine data
        const validation = validateMachineData(machine);
        if (!validation.valid) {
          results.failed.push({
            index: i,
            data: machine,
            error: validation.errors.join(', '),
          });
          continue;
        }

        // Clean the machine data
        const cleaned = cleanMachineData(machine);
        const dataWithUser = await addUserMetadata(cleaned);
        processedMachines.push(dataWithUser);
        results.success.push({ index: i, data: machine });
      } catch (err) {
        results.failed.push({
          index: i,
          data: machine,
          error: err.message,
        });
      }
    }

    // Batch insert all valid records
    if (processedMachines.length > 0) {
      const { error } = await supabase
        .from('machines')
        .insert(processedMachines);
      
      if (error) {
        // If batch insert fails, mark all as failed
        throw new Error(`Batch insert failed: ${error.message}`);
      }
    }

    return results;
  },

  filter: createFilterMethod('machines'),
};

// ============================================================
// MAINTENANCE RECORDS API
// ============================================================
export const MaintenanceRecord = {
  async list(orderBy = null, limit = null) {
    let query = supabase.from('maintenance_records').select('*');
    
    if (orderBy) {
      const [field, direction] = orderBy.startsWith('-') 
        ? [orderBy.slice(1), 'desc'] 
        : [orderBy, 'asc'];
      query = query.order(field, { ascending: direction === 'asc' });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(recordData) {
    try {
      const cleaned = cleanData(recordData);
      const dataWithUser = await addUserMetadata(cleaned);
      
      const { data, error } = await supabase
        .from('maintenance_records')
        .insert([dataWithUser])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('MaintenanceRecord.create() error:', err);
      throw err;
    }
  },

  async update(id, recordData) {
    try {
      const cleaned = cleanData(recordData);
      const dataWithUser = await addUpdateMetadata(cleaned);
      
      const { data, error } = await supabase
        .from('maintenance_records')
        .update(dataWithUser)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('MaintenanceRecord.update() error:', err);
      throw err;
    }
  },

  async delete(id) {
    const { error } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  filter: createFilterMethod('maintenance_records'),
};

// ============================================================
// MAINTENANCE CHECKLISTS API
// ============================================================
export const MaintenanceChecklist = {
  async list(orderBy = null, limit = null) {
    let query = supabase.from('maintenance_checklists').select('*');
    
    if (orderBy) {
      const [field, direction] = orderBy.startsWith('-') 
        ? [orderBy.slice(1), 'desc'] 
        : [orderBy, 'asc'];
      query = query.order(field, { ascending: direction === 'asc' });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('maintenance_checklists')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(checklistData) {
    const cleaned = cleanData(checklistData);
    const { data, error } = await supabase
      .from('maintenance_checklists')
      .insert([cleaned])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, checklistData) {
    const cleaned = cleanData(checklistData);
    const { data, error } = await supabase
      .from('maintenance_checklists')
      .update(cleaned)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('maintenance_checklists')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  filter: createFilterMethod('maintenance_checklists'),
};

// ============================================================
// MESSAGES API
// ============================================================
export const Message = {
  async list(orderBy = null, limit = null) {
    let query = supabase.from('messages').select('*');
    
    if (orderBy) {
      const [field, direction] = orderBy.startsWith('-') 
        ? [orderBy.slice(1), 'desc'] 
        : [orderBy, 'asc'];
      query = query.order(field, { ascending: direction === 'asc' });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(messageData) {
    const cleaned = cleanData(messageData);
    const { data, error } = await supabase
      .from('messages')
      .insert([cleaned])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, messageData) {
    const cleaned = cleanData(messageData);
    const { data, error } = await supabase
      .from('messages')
      .update(cleaned)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  filter: createFilterMethod('messages'),
};

// ============================================================
// TAKE5 RECORDS API
// ============================================================
export const Take5Record = {
  async list(orderBy = null, limit = null) {
    let query = supabase.from('take5_records').select('*');
    
    if (orderBy) {
      const [field, direction] = orderBy.startsWith('-') 
        ? [orderBy.slice(1), 'desc'] 
        : [orderBy, 'asc'];
      query = query.order(field, { ascending: direction === 'asc' });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('take5_records')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(recordData) {
    const cleaned = cleanData(recordData);
    const { data, error } = await supabase
      .from('take5_records')
      .insert([cleaned])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, recordData) {
    const cleaned = cleanData(recordData);
    const { data, error } = await supabase
      .from('take5_records')
      .update(cleaned)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('take5_records')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  filter: createFilterMethod('take5_records'),
};

// ============================================================
// MAINTENANCE ISSUES API
// ============================================================
export const MaintenanceIssue = {
  async list(orderBy = null, limit = null) {
    let query = supabase.from('maintenance_issues').select('*');
    
    if (orderBy) {
      const [field, direction] = orderBy.startsWith('-') 
        ? [orderBy.slice(1), 'desc'] 
        : [orderBy, 'asc'];
      query = query.order(field, { ascending: direction === 'asc' });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('maintenance_issues')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(issueData) {
    try {
      const cleaned = cleanData(issueData);
      const dataWithUser = await addUserMetadata(cleaned);
      
      const { data, error } = await supabase
        .from('maintenance_issues')
        .insert([dataWithUser])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('MaintenanceIssue.create() error:', err);
      throw err;
    }
  },

  async update(id, issueData) {
    try {
      const cleaned = cleanData(issueData);
      const dataWithUser = await addUpdateMetadata(cleaned);
      
      const { data, error } = await supabase
        .from('maintenance_issues')
        .update(dataWithUser)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('MaintenanceIssue.update() error:', err);
      throw err;
    }
  },

  async delete(id) {
    const { error } = await supabase
      .from('maintenance_issues')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  filter: createFilterMethod('maintenance_issues'),
};

// ============================================================
// WORKSHOP JOB CARDS API
// ============================================================
export const WorkshopJobCard = {
  async list(orderBy = null, limit = null) {
    let query = supabase.from('workshop_job_cards').select('*');
    
    if (orderBy) {
      const [field, direction] = orderBy.startsWith('-') 
        ? [orderBy.slice(1), 'desc'] 
        : [orderBy, 'asc'];
      query = query.order(field, { ascending: direction === 'asc' });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('workshop_job_cards')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(cardData) {
    try {
      const cleaned = cleanData(cardData);
      const dataWithUser = await addUserMetadata(cleaned);
      
      const { data, error } = await supabase
        .from('workshop_job_cards')
        .insert([dataWithUser])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('WorkshopJobCard.create() error:', err);
      throw err;
    }
  },

  async update(id, cardData) {
    try {
      const cleaned = cleanData(cardData);
      const dataWithUser = await addUpdateMetadata(cleaned);
      
      const { data, error } = await supabase
        .from('workshop_job_cards')
        .update(dataWithUser)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('WorkshopJobCard.update() error:', err);
      throw err;
    }
  },

  async delete(id) {
    const { error } = await supabase
      .from('workshop_job_cards')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  filter: createFilterMethod('workshop_job_cards'),
};

// ============================================================
// WORKSHOP INVENTORY API
// ============================================================
export const WorkshopInventory = {
  async list(orderBy = null, limit = null) {
    let query = supabase.from('workshop_inventory').select('*');
    
    if (orderBy) {
      const [field, direction] = orderBy.startsWith('-') 
        ? [orderBy.slice(1), 'desc'] 
        : [orderBy, 'asc'];
      query = query.order(field, { ascending: direction === 'asc' });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('workshop_inventory')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(itemData) {
    try {
      const cleaned = cleanData(itemData);
      const dataWithUser = await addUserMetadata(cleaned);
      
      const { data, error } = await supabase
        .from('workshop_inventory')
        .insert([dataWithUser])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('WorkshopInventory.create() error:', err);
      throw err;
    }
  },

  async update(id, itemData) {
    try {
      const cleaned = cleanData(itemData);
      const dataWithUser = await addUpdateMetadata(cleaned);
      
      const { data, error } = await supabase
        .from('workshop_inventory')
        .update(dataWithUser)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('WorkshopInventory.update() error:', err);
      throw err;
    }
  },

  async delete(id) {
    const { error } = await supabase
      .from('workshop_inventory')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  filter: createFilterMethod('workshop_inventory'),
};

// ============================================================
// NOTIFICATIONS API
// ============================================================
export const Notification = {
  async list(orderBy = null, limit = null) {
    let query = supabase.from('notifications').select('*');
    
    if (orderBy) {
      const [field, direction] = orderBy.startsWith('-') 
        ? [orderBy.slice(1), 'desc'] 
        : [orderBy, 'asc'];
      query = query.order(field, { ascending: direction === 'asc' });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(notificationData) {
    const cleaned = cleanData(notificationData);
    const { data, error } = await supabase
      .from('notifications')
      .insert([cleaned])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, notificationData) {
    const cleaned = cleanData(notificationData);
    const { data, error } = await supabase
      .from('notifications')
      .update(cleaned)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  filter: createFilterMethod('notifications'),
};

// ============================================================
// SERVICE CARDS API
// ============================================================
export const ServiceCard = {
  async list(orderBy = null, limit = null) {
    let query = supabase.from('service_cards').select('*');
    
    if (orderBy) {
      const [field, direction] = orderBy.startsWith('-') 
        ? [orderBy.slice(1), 'desc'] 
        : [orderBy, 'asc'];
      query = query.order(field, { ascending: direction === 'asc' });
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase
      .from('service_cards')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(cardData) {
    try {
      const cleaned = cleanData(cardData);
      const dataWithUser = await addUserMetadata(cleaned);
      
      const { data, error } = await supabase
        .from('service_cards')
        .insert([dataWithUser])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('ServiceCard.create() error:', err);
      throw err;
    }
  },

  async update(id, cardData) {
    try {
      const cleaned = cleanData(cardData);
      const dataWithUser = await addUpdateMetadata(cleaned);
      
      const { data, error } = await supabase
        .from('service_cards')
        .update(dataWithUser)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('ServiceCard.update() error:', err);
      throw err;
    }
  },

  async delete(id) {
    const { error } = await supabase
      .from('service_cards')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  filter: createFilterMethod('service_cards'),
};

// ============================================================
// HELPER: Sync employee role to auth.user_metadata
// ============================================================
// Role is now managed in the employees table only
// No need to sync to auth metadata

// ============================================================
// EMPLOYEES
// ============================================================
export const Employee = {
  async list(orderBy = null, limit = null) {
    try {
      let query = supabase.from('employees').select('*');
      
      if (orderBy) {
        const [field, direction] = orderBy.startsWith('-') 
          ? [orderBy.slice(1), 'desc'] 
          : [orderBy, 'asc'];
        query = query.order(field, { ascending: direction === 'asc' });
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Employee.list() error:', err);
      throw err;
    }
  },

  async get(id) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Employee.get() error:', err);
      throw err;
    }
  },

  async create(employeeData) {
    try {
      const user = await getCurrentUser();
      
      const cleaned = cleanData({
        ...employeeData,
        role: employeeData.role || 'employee', // DEFAULT TO EMPLOYEE
        created_by: user.id,
      });

      const { data, error } = await supabase
        .from('employees')
        .insert([cleaned])
        .select();
      
      if (error) throw error;

      return data[0];
    } catch (err) {
      console.error('Employee.create() error:', err);
      throw err;
    }
  },

  async update(id, employeeData) {
    try {
      const user = await getCurrentUser();
      
      const cleaned = cleanData({
        ...employeeData,
        updated_by: user.id,
      });

      const { data, error } = await supabase
        .from('employees')
        .update(cleaned)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Employee.update() error:', err);
      throw err;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Employee.delete() error:', err);
      throw err;
    }
  },

  filter: createFilterMethod('employees'),
};

// ============================================================
// USER AUTH (Supabase Auth)
// ============================================================
export const User = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signup(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
};

// ============================================================
// CREWS
// ============================================================
export const Crew = {
  async list(orderBy = null, limit = null) {
    try {
      let query = supabase.from('crews').select('*');
      
      if (orderBy) {
        const [field, direction] = orderBy.startsWith('-') 
          ? [orderBy.slice(1), 'desc'] 
          : [orderBy, 'asc'];
        query = query.order(field, { ascending: direction === 'asc' });
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Crew.list() error:', err);
      throw err;
    }
  },

  async get(id) {
    try {
      const { data, error } = await supabase
        .from('crews')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Crew.get() error:', err);
      throw err;
    }
  },

  async create(crewData) {
    try {
      const cleaned = cleanData(crewData);
      
      const { data, error } = await supabase
        .from('crews')
        .insert([cleaned])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Crew.create() error:', err);
      throw err;
    }
  },

  async update(id, crewData) {
    try {
      const cleaned = cleanData(crewData);
      
      const { data, error } = await supabase
        .from('crews')
        .update(cleaned)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Crew.update() error:', err);
      throw err;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase
        .from('crews')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Crew.delete() error:', err);
      throw err;
    }
  },

  filter: createFilterMethod('crews'),
};