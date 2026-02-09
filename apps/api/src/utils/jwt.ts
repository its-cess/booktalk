import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET!;
const expiresIn = process.env.JWT_EXPIRES_IN ?? "1h";

export function signToken(payload: object) {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string) {
  return jwt.verify(token, secret);
}
