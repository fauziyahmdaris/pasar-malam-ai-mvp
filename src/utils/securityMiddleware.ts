import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// Password validation interface
export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

// Password validation schema
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

// Check if user has specific role
export const hasRole = async (
  role: "admin" | "seller" | "customer",
): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    return roles?.some((r) => r.role === role) || false;
  } catch (error) {
    console.error("Error checking role:", error);
    return false;
  }
};

// Verify seller owns the stall
export const verifyStallOwnership = async (
  stallId: string,
): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
export const verifyOrderOwnership = async (
  orderId: string,
): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
  if (!phone) return "";
  // Keep first 3 and last 2 digits visible, mask the rest
  const firstPart = phone.substring(0, 3);
  const lastPart = phone.substring(phone.length - 2);
  const maskedPart = "*".repeat(phone.length - 5);
  return `${firstPart}${maskedPart}${lastPart}`;
};

// Helper function to create SHA-1 hash
const sha1 = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

// Check if password has been leaked using HIBP API
export const checkPasswordBreached = async (
  password: string,
): Promise<boolean> => {
  try {
    const hash = await sha1(password);
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5).toUpperCase();

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
    );
    if (!response.ok) {
      // If the API returns an error, we'll assume the password is not breached
      // to avoid blocking users due to API issues.
      console.error("Error fetching from HIBP API:", response.statusText);
      return false;
    }

    const text = await response.text();
    const hashes = text.split("\r\n").map((line) => line.split(":")[0]);

    return hashes.includes(suffix);
  } catch (error) {
    console.error("Error checking password breach:", error);
    // Fail safe: if there's an error, assume password is not breached
    return false;
  }
};

// Validate password and check for breaches
export const validatePassword = async (
  password: string
): Promise<PasswordValidationResult> => {
  try {
    // Validate password strength using zod schema
    passwordSchema.parse(password);

    // Check if password has been breached
    const isBreached = await checkPasswordBreached(password);
    if (isBreached) {
      return {
        isValid: false,
        message: "This password appears in data breaches. Please choose a different password."
      };
    }

    return { 
      isValid: true,
      message: "Password meets all requirements"
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        message: error.errors[0].message 
      };
    }
    return { 
      isValid: false, 
      message: "Password validation failed" 
    };
  }
};
