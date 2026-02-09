import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    "Missing Razorpay keys. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
  );
}

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});
