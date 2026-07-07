import { type GradeManualNotation } from "@domain/grade/grade-manual-notation/grade-manual-notation.entity";

export interface GradeManualNotationRepository {
    findById(id: string): Promise<GradeManualNotation | undefined>;
    findByGradeId(gradeId: string): Promise<GradeManualNotation[]>;
    findByGradeManualId(gradeManualId: string): Promise<GradeManualNotation[]>;
    findByGradeAndManualNotation(gradeId: string, gradeManualId: string): Promise<GradeManualNotation | undefined>;
    save(gradeManualNotation: GradeManualNotation): Promise<void>;
    deleteById(id: string): Promise<void>;
}
