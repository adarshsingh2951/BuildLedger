import Material from "../models/Material.js";
export async function applyStock(materialId, type, quantity) {
  const delta = type === "Inbound" ? quantity : -quantity;
  const material = await Material.findById(materialId);
  if (!material) { const error = new Error("Material not found"); error.statusCode = 404; throw error; }
  if (material.currentStock + delta < 0) { const error = new Error("Outbound quantity exceeds current stock"); error.statusCode = 400; throw error; }
  material.currentStock += delta; await material.save(); return { material, newStock: material.currentStock };
}