import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as ReviewService from "./review.service";

export const queue = catchAsync(async (req, res) => {
  const result = await ReviewService.queue(req.query as never);
  sendResponse(
    res,
    200,
    "Review queue retrieved successfully",
    result.data,
    result.meta,
  );
});

export const claim = catchAsync(async (req, res) => {
  const result = await ReviewService.claim(req.user!.id, req.params.attemptId);
  sendResponse(res, 200, "Attempt claimed successfully", result);
});

export const getAttempt = catchAsync(async (req, res) => {
  const result = await ReviewService.getReviewAttempt(
    req.user!.id,
    req.params.attemptId,
  );
  sendResponse(res, 200, "Review attempt retrieved successfully", result);
});

export const evaluate = catchAsync(async (req, res) => {
  const result = await ReviewService.evaluate(
    req.user!.id,
    req.params.attemptId,
    req.body,
  );
  sendResponse(res, 200, "Attempt evaluated successfully", result);
});

export const mine = catchAsync(async (req, res) => {
  const result = await ReviewService.mine(req.user!.id, req.query as never);
  sendResponse(
    res,
    200,
    "Assigned reviews retrieved successfully",
    result.data,
    result.meta,
  );
});
