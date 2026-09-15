// Shared JSON response envelope for every endpoint under api/. Keeping the shape in one
// place (rather than each route building its own { success, ... } object) means every
// current and future API endpoint returns something consistent, and the shape only has to
// change in one place if it ever needs to.

export function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function sendError(res, message, status = 500) {
  return res.status(status).json({ success: false, error: message });
}
