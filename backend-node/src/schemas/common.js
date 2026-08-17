import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const roleSchema = z.object({
  role: z.enum(["Admin", "Storekeeper", "Engineer", "Worker"]),
});

export const materialSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(2),
  priorityTag: z.enum(["A", "B", "C"]),
  unit: z.string().min(1),
  currentStock: z.number().min(0).default(0),
  minimumThreshold: z.number().min(0),
});

export const taskSchema = z.object({
  taskName: z.string().min(2),
  assignedTo: z.string(),
  status: z.enum(["Pending", "In Progress", "Completed"]).default("Pending"),
  expectedDays: z.number().min(0).optional(),
});

export const transactionSchema = z.object({
  materialId: z.string(),
  transactionType: z.enum(["Inbound", "Outbound"]),
  quantity: z.number().positive(),
  relatedTask: z.string().optional().nullable(),
});

export const settingsSchema = z.object({
  siteName: z.string().min(2).max(100),
  siteCode: z.string().min(2).max(30),
  projectNote: z.string().max(300).default(""),
});
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128),
});

export const taskUpdateSchema = z.object({
  expectedDays: z.number().min(0).optional(),
  progress: z.number().min(0).max(100).optional(),
  requiredMaterials: z
    .array(
      z.object({
        materialId: z.string(),
        materialName: z.string(),
        unit: z.string().optional(),
        quantity: z.number().min(0),
      })
    )
    .optional(),
});

export const taskMemberSchema = z.object({
  userId: z.string(),
  kind: z.enum(["Engineer", "Worker"]),
});

export function parse(schema, payload) {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const error = new Error(
      result.error.issues.map((x) => x.message).join(" ")
    );
    error.statusCode = 422;
    throw error;
  };




  return result.data;
}