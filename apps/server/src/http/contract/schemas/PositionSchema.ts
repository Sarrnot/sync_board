import { z } from "zod";

/** A fractional-index position key (lexicographically ordered). */
export const PositionSchema = z.string().min(1);
