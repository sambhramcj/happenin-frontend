// frontend/src/lib/razorpay-route.ts
/**
 * Razorpay Route API Helper
 * 
 * Handles Razorpay Route sub-merchant creation and KYC verification
 * for organizer payout initialization.
 * 
 * Docs: https://razorpay.com/docs/route/
 */

const RAZORPAY_ROUTE_API_BASE = "https://api.razorpay.com/v1";

interface RazorpayRouteSubMerchantPayload {
  // Business information
  business_name: string;
  business_type: string;
  email: string;
  phone: string;

  // Bank details
  bank_account: {
    account_number: string;
    ifsc_code: string;
    beneficiary_name: string;
  };

  // PAN (required for all sub-merchants)
  pan: string;

  // Notes (store organizer type for reference)
  notes?: {
    organizer_type: "CLUB" | "FEST";
    display_name: string;
  };
}

interface RazorpayRouteErrorResponse {
  error?: {
    code: string;
    description: string;
    field?: string;
  };
}

interface RazorpaySubMerchantResponse {
  id: string;
  email: string;
  phone: string;
  type: "route";
  status: string;
  requirements?: {
    required_fields?: string[];
  };
}

/**
 * Create a Razorpay Route sub-merchant account
 * 
 * @param payload Sub-merchant details (PAN, bank, etc.)
 * @returns { accountId: string } on success
 * @throws Error with Razorpay-specific message on failure
 */
export async function createRazorpaySubMerchant(
  payload: RazorpayRouteSubMerchantPayload
): Promise<{ accountId: string; status: string }> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }

  // Encode credentials for Basic Auth
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  try {
    const response = await fetch(`${RAZORPAY_ROUTE_API_BASE}/accounts`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: payload.business_name,
        business_type: payload.business_type,
        email: payload.email,
        phone: payload.phone,
        bank_account: payload.bank_account,
        pan: payload.pan,
        ...(payload.notes && { notes: payload.notes }),
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as RazorpayRouteErrorResponse;
      const errorMsg =
        errorData.error?.description ||
        `Razorpay error: ${response.statusText}`;

      throw new Error(errorMsg);
    }

    const data = (await response.json()) as RazorpaySubMerchantResponse;

    return {
      accountId: data.id,
      status: data.status,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create Razorpay sub-merchant");
  }
}

/**
 * Fetch sub-merchant KYC status
 * 
 * @param accountId Razorpay sub-merchant account ID
 * @returns KYC status and any required fields
 */
export async function getRazorpaySubMerchantStatus(
  accountId: string
): Promise<{
  status: string;
  kyc_status?: string;
  requirements?: string[];
}> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  try {
    const response = await fetch(
      `${RAZORPAY_ROUTE_API_BASE}/accounts/${accountId}`,
      {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch account status: ${response.statusText}`
      );
    }

    const data = (await response.json()) as any;

    return {
      status: data.status,
      kyc_status: data.kyc_status,
      requirements: data.requirements?.required_fields || [],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch Razorpay sub-merchant status");
  }
}

/**
 * Validate PAN holder name matches bank account holder name
 * This is required by Razorpay Route for KYC
 * 
 * @param legal_name Name from PAN
 * @param bank_account_holder Bank account holder name
 * @returns true if names match (approximately), false otherwise
 */
export function validatePanBankNameMatch(
  legal_name: string,
  bank_account_holder: string
): boolean {
  // Normalize: remove extra spaces, convert to lowercase
  const normalize = (str: string) =>
    str
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const norm1 = normalize(legal_name);
  const norm2 = normalize(bank_account_holder);

  // Exact match
  if (norm1 === norm2) return true;

  // Check if one is substring of other (handles common variations)
  // E.g., "John Doe Smith" vs "John Smith" might be acceptable
  const parts1 = norm1.split(" ");
  const parts2 = norm2.split(" ");

  // If all parts of shorter name are in longer name, it's a match
  const shorter = parts1.length <= parts2.length ? parts1 : parts2;
  const longer = parts1.length > parts2.length ? parts1 : parts2;

  return shorter.every((part) => longer.includes(part));
}

/**
 * Validate IFSC code format (Indian Financial System Code)
 * Format: 4 letters + 0 + 6 digits
 */
export function validateIFSCFormat(ifsc: string): boolean {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc.toUpperCase());
}

/**
 * Validate PAN format (Permanent Account Number - India)
 * Format: 10 alphanumeric characters
 * Pattern: AAAPA5055K
 */
export function validatePANFormat(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
}

/**
 * Validate Indian bank account number format
 * Typically 9-18 digits
 */
export function validateBankAccountFormat(accountNumber: string): boolean {
  const accountRegex = /^[0-9]{9,18}$/;
  return accountRegex.test(accountNumber);
}
