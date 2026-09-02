import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as AdminService from "./admin.service";

export const listUsers = catchAsync(async (req, res) => {
  const result = await AdminService.listUsers(req.query as never);
  sendResponse(res, 200, "Users retrieved successfully", result.data, result.meta);
});

export const updateStatus = catchAsync(async (req, res) => {
  const result = await AdminService.updateUserStatus(
    req.user!.id,
    req.params.userId,
    req.body.status
  );
  sendResponse(res, 200, "User status updated successfully", result);
});

export const softDeleteUser = catchAsync(async (req, res) => {
  await AdminService.softDeleteUser(req.user!.id, req.params.userId);
  sendResponse(res, 200, "User deleted successfully", null);
});

export const stats = catchAsync(async (_req, res) => {
  const result = await AdminService.stats();
  sendResponse(res, 200, "Dashboard statistics retrieved successfully", result);
});

export const auditLogs = catchAsync(async (req, res) => {
  const result = await AdminService.auditLogs(req.query as never);
  sendResponse(res, 200, "Audit logs retrieved successfully", result.data, result.meta);
});


export const updateRole = catchAsync(async (req, res) => {
  const result = await AdminService.updateUserRole(
    req.user!.id,
    req.params.userId,
    req.body.role
  );
  sendResponse(res, 200, "User role updated successfully", result);
});
