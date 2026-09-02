import { z } from "zod";

export const initiatePaymentSchema = z.object({
  params: z.object({ attemptId: z.string().uuid() }),
  body: z.object({
    paymentMethodId: z.string().min(3).optional()
  })
});

export const confirmPaymentSchema = z.object({
  params: z.object({ paymentId: z.string().uuid() }),
  body: z.object({
    paymentMethodId: z.string().min(3)
  })
});

export const paymentIdSchema = z.object({
  params: z.object({ paymentId: z.string().uuid() })
});

export const attemptPaymentSchema = z.object({
  params: z.object({ attemptId: z.string().uuid() })
});
