export const GRADE_MIN_VALUE = 0;
export const GRADE_MAX_VALUE = 20;

export const isValidGradeValue = (value: number): boolean =>
    Number.isFinite(value) && value >= GRADE_MIN_VALUE && value <= GRADE_MAX_VALUE;
