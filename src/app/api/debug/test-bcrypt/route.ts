import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const testPassword = "password123";
    
    // Test hashing with different salt rounds
    const hash1 = await bcrypt.hash(testPassword, 10);
    const hash2 = await bcrypt.hash(testPassword, 10);
    
    // Test comparing
    const compare1 = await bcrypt.compare(testPassword, hash1);
    const compare2 = await bcrypt.compare(testPassword, hash2);
    const compareFalse = await bcrypt.compare("wrongpassword", hash1);
    
    return Response.json({
      bcryptWorking: true,
      testPassword,
      hash1: hash1.substring(0, 30) + "...",
      hash2: hash2.substring(0, 30) + "...",
      compare1: compare1,
      compare2: compare2,
      compareFalse: compareFalse,
      hashLength: hash1.length,
    });
  } catch (error: any) {
    return Response.json({ 
      error: error.message,
      bcryptWorking: false,
      stack: error.stack
    }, { status: 500 });
  }
}
