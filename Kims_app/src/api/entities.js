import { supabase } from './supabaseClient';

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
    const { data, error } = await supabase
      .from('machines')
      .insert([machineData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, machineData) {
    const { data, error } = await supabase
      .from('machines')
      .update(machineData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('machines')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
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
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert([recordData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, recordData) {
    const { data, error } = await supabase
      .from('maintenance_records')
      .update(recordData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
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
    const { data, error } = await supabase
      .from('maintenance_checklists')
      .insert([checklistData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, checklistData) {
    const { data, error } = await supabase
      .from('maintenance_checklists')
      .update(checklistData)
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
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, messageData) {
    const { data, error } = await supabase
      .from('messages')
      .update(messageData)
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
    const { data, error } = await supabase
      .from('take5_records')
      .insert([recordData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, recordData) {
    const { data, error } = await supabase
      .from('take5_records')
      .update(recordData)
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
    const { data, error } = await supabase
      .from('maintenance_issues')
      .insert([issueData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, issueData) {
    const { data, error } = await supabase
      .from('maintenance_issues')
      .update(issueData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('maintenance_issues')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
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
    const { data, error } = await supabase
      .from('workshop_job_cards')
      .insert([cardData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, cardData) {
    const { data, error } = await supabase
      .from('workshop_job_cards')
      .update(cardData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('workshop_job_cards')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
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
    const { data, error } = await supabase
      .from('workshop_inventory')
      .insert([itemData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, itemData) {
    const { data, error } = await supabase
      .from('workshop_inventory')
      .update(itemData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('workshop_inventory')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
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
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, notificationData) {
    const { data, error } = await supabase
      .from('notifications')
      .update(notificationData)
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
    const { data, error } = await supabase
      .from('service_cards')
      .insert([cardData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, cardData) {
    const { data, error } = await supabase
      .from('service_cards')
      .update(cardData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('service_cards')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
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