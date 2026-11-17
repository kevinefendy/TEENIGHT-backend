
import * as bcrypt from "bcrypt";

// Mengubah password menjadi hash
export const hashPassword = async (
  password: string
): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

// Membandingkan password dengan hash database
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
