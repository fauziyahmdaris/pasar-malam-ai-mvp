import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// Password strength validation schema
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Check if user has specific role
export const hasRole = async (role: 'admin' | 'seller' | 'customer'): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    return roles?.some(r => r.role === role) || false;
  } catch (error) {
    console.error("Error checking role:", error);
    return false;
  }
};

// Verify seller owns the stall
export const verifyStallOwnership = async (stallId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("seller_stalls")
      .select("seller_id")
      .eq("id", stallId)
      .single();

    if (error || !data) return false;
    return data.seller_id === user.id;
  } catch (error) {
    console.error("Error verifying stall ownership:", error);
    return false;
  }
};

// Verify seller owns the order
export const verifyOrderOwnership = async (orderId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("pre_orders")
      .select("seller_stalls!inner(seller_id)")
      .eq("id", orderId)
      .single();

    if (error || !data) return false;
    return data.seller_stalls.seller_id === user.id;
  } catch (error) {
    console.error("Error verifying order ownership:", error);
    return false;
  }
};

// Encrypt sensitive data for storage (for client-side encryption)
export const encryptData = (data: string): string => {
  // In a real implementation, this would use a proper encryption library
  // For MVP, we'll just implement a basic obfuscation
  return btoa(data);
};

// Decrypt sensitive data (for client-side decryption)
export const decryptData = (encryptedData: string): string => {
  // In a real implementation, this would use a proper decryption library
  // For MVP, we'll just implement a basic deobfuscation
  return atob(encryptedData);
};

// Mask sensitive data for display
export const maskPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  // Keep first 3 and last 2 digits visible, mask the rest
  const firstPart = phone.substring(0, 3);
  const lastPart = phone.substring(phone.length - 2);
  const maskedPart = '*'.repeat(phone.length - 5);
  return `${firstPart}${maskedPart}${lastPart}`;
};

// Check if password has been leaked (mock implementation for MVP)
export const checkPasswordBreached = async (password: string): Promise<boolean> => {
  // In production, this would call a service like HIBP API
  // For MVP, we'll implement a basic check for common passwords
  const commonPasswords = [
    'password', 'password123', '123456', 'qwerty', 'admin', 
    'welcome', 'letmein', 'abc123', 'monkey', 'dragon'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

// Validate password and check for breaches
export const validatePassword = async (password: string): Promise<{ valid: boolean; message?: string }> => {
  try {
    // Validate password strength
    passwordSchema.parse(password);
    
    // Check if password has been breached
    const isBreached = await checkPasswordBreached(password);
    if (isBreached) {
      return { 
        valid: false, 
        message: "This password appears in data breaches. Please choose a different password." 
      };
    }
    
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, message: error.errors[0].message };
    }
    return { valid: false, message: "Password validation failed" };
  }
};