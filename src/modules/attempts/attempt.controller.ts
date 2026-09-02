import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as AttemptService from "./attempt.service";

export const enroll = catchAsync(async (req, res) => {
  const result = await AttemptService.enroll(req.user!.id, req.params.assessmentId);
  sendResponse(res, 201, "Enrollment created successfully", result);
});

export const start = catchAsync(async (req, res) => {
  const result = await AttemptService.start(req.user!.id, req.params.attemptId);
  sendResponse(res, 200, "Assessment attempt started", result);
});

export const saveAnswer = catchAsync(async (req, res) => {
  const result = await AttemptService.saveAnswer(
    req.user!.id,
    req.params.attemptId,
    req.params.questionId,
    req.body.response
  );
  sendResponse(res, 200, "Answer saved successfully", result);
});

export const submit = catchAsync(async (req, res) => {
  const result = await AttemptService.submit(req.user!.id, req.params.attemptId);
  sendResponse(res, 200, "Attempt submitted successfully", result);
});

export const listMine = catchAsync(async (req, res) => {
  const result = await AttemptService.listMine(req.user!.id, req.query as never);
  sendResponse(res, 200, "Attempts retrieved successfully", result.data, result.meta);
});

export const getMine = catchAsync(async (req, res) => {
  const result = await AttemptService.getCandidateAttempt(req.user!.id, req.params.attemptId);
  sendResponse(res, 200, "Attempt retrieved successfully", result);
});
