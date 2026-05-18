export interface FormulaIngredient {
  productId: string | null;
  productName: string;
  brand: string | null;
  quantityOz: number | null;
  quantityGrams: number | null;
  developerVolume: number | null; // e.g., 10, 20, 30 vol
  notes: string | null;
}

export interface ColorFormulaRecord {
  id: string;
  clientId: string;
  appointmentId: string | null;
  staffId: string;
  formulaVersion: number;
  formulaIngredients: FormulaIngredient[];
  processingMinutes: number | null;
  resultNotes: string | null;
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  allergyChecked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
