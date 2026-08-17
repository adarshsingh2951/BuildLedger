export function notFound(req, res) { res.status(404).json({ detail: "Route not found" }); }
export function errorHandler(error, req, res, next) {
    console.error(error); res.status(error.statusCode || (error.code === 11000 ? 409 : 500)).json({ detail: error.code === 11000 ? "A unique value already exists" : error.message || "Server error" });
}