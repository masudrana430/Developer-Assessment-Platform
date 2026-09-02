import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as PaymentService from "./payment.service";

export const initiate = catchAsync(async (req, res) => {
  const result = await PaymentService.initiate(
    req.user!.id,
    req.params.attemptId,
    req.body.paymentMethodId
  );
  sendResponse(res, 201, "Payment initiated successfully", result);
});

export const confirm = catchAsync(async (req, res) => {
  const result = await PaymentService.confirm(
    req.user!.id,
    req.params.paymentId,
    req.body.paymentMethodId
  );
  sendResponse(res, 200, "Payment confirmation processed", result);
});

export const getById = catchAsync(async (req, res) => {
  const result = await PaymentService.getById(req.user!, req.params.paymentId);
  sendResponse(res, 200, "Payment retrieved successfully", result);
});

export const getByAttempt = catchAsync(async (req, res) => {
  const result = await PaymentService.getByAttempt(req.user!.id, req.params.attemptId);
  sendResponse(res, 200, "Payment retrieved successfully", result);
});

export const webhook = catchAsync(async (req, res) => {
  const result = await PaymentService.handleWebhook(
    req.body as Buffer,
    req.headers["stripe-signature"] as string | undefined
  );
  sendResponse(res, 200, "Webhook processed successfully", result);
});
