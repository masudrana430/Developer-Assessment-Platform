import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as AssessmentService from "./assessment.service";

export const create = catchAsync(async (req, res) => {
  const result = await AssessmentService.create(req.user!, req.body);
  sendResponse(res, 201, "Assessment created successfully", result);
});

export const list = catchAsync(async (req, res) => {
  const result = await AssessmentService.list(req.query as never);
  sendResponse(res, 200, "Assessments retrieved successfully", result.data, result.meta);
});

export const getById = catchAsync(async (req, res) => {
  const result = await AssessmentService.getById(req.params.id);
  sendResponse(res, 200, "Assessment retrieved successfully", result);
});

export const update = catchAsync(async (req, res) => {
  const result = await AssessmentService.update(req.params.id, req.user!, req.body);
  sendResponse(res, 200, "Assessment updated successfully", result);
});

export const publish = catchAsync(async (req, res) => {
  const result = await AssessmentService.publish(req.params.id, req.user!);
  sendResponse(res, 200, "Assessment published successfully", result);
});

export const softDelete = catchAsync(async (req, res) => {
  await AssessmentService.softDelete(req.params.id, req.user!);
  sendResponse(res, 200, "Assessment deleted successfully", null);
});

export const addQuestion = catchAsync(async (req, res) => {
  const result = await AssessmentService.addQuestion(req.params.id, req.user!, req.body);
  sendResponse(res, 201, "Question added successfully", result);
});

export const updateQuestion = catchAsync(async (req, res) => {
  const result = await AssessmentService.updateQuestion(
    req.params.id,
    req.params.questionId,
    req.user!,
    req.body
  );
  sendResponse(res, 200, "Question updated successfully", result);
});

export const deleteQuestion = catchAsync(async (req, res) => {
  await AssessmentService.deleteQuestion(req.params.id, req.params.questionId, req.user!);
  sendResponse(res, 200, "Question deleted successfully", null);
});


export const listManaged = catchAsync(async (req, res) => {
  const result = await AssessmentService.listManaged(req.user!, req.query as never);
  sendResponse(res, 200, "Managed assessments retrieved successfully", result.data, result.meta);
});

export const getManaged = catchAsync(async (req, res) => {
  const result = await AssessmentService.getManaged(req.params.id, req.user!);
  sendResponse(res, 200, "Managed assessment retrieved successfully", result);
});
