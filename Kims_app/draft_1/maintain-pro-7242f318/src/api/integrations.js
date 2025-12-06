import { supabase } from './supabaseClient';

// ============================================================
// FILE STORAGE & UPLOADS (Supabase Storage)
// ============================================================
export const Core = {
  UploadFile: async (file, bucket = 'files', path = '') => {
    const fileName = path ? `${path}/${file.name}` : file.name;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
    if (error) throw error;
    return data;
  },

  UploadPrivateFile: async (file, bucket = 'private-files', path = '') => {
    const fileName = path ? `${path}/${file.name}` : file.name;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
    if (error) throw error;
    return data;
  },

  CreateFileSignedUrl: async (filePath, bucket = 'files', expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);
    if (error) throw error;
    return data;
  },

  DeleteFile: async (filePath, bucket = 'files') => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    if (error) throw error;
  },

  ListFiles: async (bucket = 'files', path = '') => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);
    if (error) throw error;
    return data;
  },
};

export const InvokeLLM = async (prompt, model = 'gpt-3.5-turbo') => {
  // Placeholder for future LLM integration via Supabase Edge Functions
  throw new Error('LLM integration not yet implemented. Use Supabase Edge Functions for this.');
};

export const SendEmail = async (to, subject, body) => {
  // Placeholder for future email integration via Supabase Edge Functions
  throw new Error('Email integration not yet implemented. Use Supabase Edge Functions for this.');
};

export const UploadFile = Core.UploadFile;

export const GenerateImage = async (prompt) => {
  // Placeholder for future image generation via Supabase Edge Functions
  throw new Error('Image generation not yet implemented. Use Supabase Edge Functions for this.');
};

export const ExtractDataFromUploadedFile = async (filePath) => {
  // Placeholder for future file parsing via Supabase Edge Functions
  throw new Error('File extraction not yet implemented. Use Supabase Edge Functions for this.');
};

export const CreateFileSignedUrl = Core.CreateFileSignedUrl;

export const UploadPrivateFile = Core.UploadPrivateFile;






