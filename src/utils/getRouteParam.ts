import { AppError } from "./AppError";

/**
 * Normalizes an Express route parameter before it is passed to a service.
 * Express 5 types route parameters as `string | string[]`; all current
 * service APIs accept a single identifier string.
 */
export const getRouteParam = (value: string | string[] | undefined, name = "parameter"): string => {
  const param = Array.isArray(value) ? value[0] : value;

  if (!param) {
    throw new AppError(400, `${name} is required`);
  }

  return param;
};
